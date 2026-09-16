import fs from 'node:fs';
import vm from 'node:vm';

const API_URL = 'https://api.buffer.com';
const token = process.env.BUFFER_API_KEY;
const targetDate = process.env.BUFFER_TARGET_DATE || '';

if (!token) throw new Error('BUFFER_API_KEY is not set');

async function graphql(query, variables = {}) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json();
  if (!response.ok || body.errors?.length) {
    throw new Error(`Buffer API error: ${JSON.stringify(body.errors || body)}`);
  }
  return body.data;
}

function loadEdition() {
  const source = fs.readFileSync('daily-data.js', 'utf8');
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'daily-data.js' });
  const stories = [...(context.window.dailyStories || [])]
    .filter(story => story.id && story.isoDate)
    .sort((a, b) => b.isoDate.localeCompare(a.isoDate));
  const editionDate = targetDate || stories[0]?.isoDate;
  return stories.filter(story => story.isoDate === editionDate);
}

async function main() {
  const stories = loadEdition();
  const storyByPath = new Map(stories.map(story => [`/stories/${story.id}/`, story]));
  const account = await graphql(`query { account { organizations { id name } } }`);

  for (const organization of account.account.organizations) {
    const channelData = await graphql(
      `query Channels($input: ChannelsInput!) {
        channels(input: $input) {
          id name service isDisconnected isLocked organizationId
        }
      }`,
      { input: { organizationId: organization.id, filter: { isLocked: false } } },
    );
    const channels = channelData.channels.filter(channel =>
      (channel.service === 'twitter' || channel.service === 'instagram' || channel.service.startsWith('facebook')) &&
      !channel.isDisconnected,
    );

    for (const channel of channels) {
      const postData = await graphql(
        `query Posts($input: PostsInput!, $first: Int) {
          posts(input: $input, first: $first) {
            edges { node { id text dueAt status channelId } }
          }
        }`,
        {
          input: {
            organizationId: organization.id,
            filter: { channelIds: [channel.id], status: ['scheduled', 'sending', 'sent'] },
            sort: [{ field: 'dueAt', direction: 'desc' }],
          },
          first: 100,
        },
      );

      for (const edge of postData.posts.edges) {
        const post = edge.node;
        const path = [...storyByPath.keys()].find(candidate => post.text.includes(candidate));
        if (!path) continue;
        const story = storyByPath.get(path);
        console.log(`STATUS|${channel.service}|${channel.name}|${story.id}|${post.status}|${post.dueAt || ''}|${post.id}`);
      }
    }
  }
}

await main();
