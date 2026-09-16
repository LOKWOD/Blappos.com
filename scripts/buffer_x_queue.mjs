import fs from 'node:fs';
import vm from 'node:vm';

const API_URL = 'https://api.buffer.com';
const SITE_URL = 'https://blappos.com';
const MAX_QUEUE = 10;
const MAX_PER_RUN = Number(process.env.BUFFER_POSTS_PER_RUN || 5);
const targetDate = process.env.BUFFER_TARGET_DATE || '';
const shareMode = process.env.BUFFER_SHARE_MODE || 'addToQueue';
const token = process.env.BUFFER_API_KEY;

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

function loadStories() {
  const source = fs.readFileSync('daily-data.js', 'utf8');
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'daily-data.js' });
  return [...(context.window.dailyStories || [])]
    .filter(story => story.id && story.isoDate && story.image && story.title)
    .sort((a, b) => b.isoDate.localeCompare(a.isoDate));
}

function postText(story) {
  const url = `${SITE_URL}/stories/${story.id}/`;
  const place = story.place ? `${story.place}: ` : '';
  const text = `${place}${story.title}\n\n${url}`;
  if (text.length > 280) throw new Error(`X post exceeds 280 characters: ${story.id}`);
  return text;
}

async function main() {
  const account = await graphql(`query { account { organizations { id name } } }`);
  const organizations = account.account.organizations;
  if (!organizations.length) throw new Error('No Buffer organization found');

  let selected;
  for (const organization of organizations) {
    const data = await graphql(
      `query Channels($input: ChannelsInput!) {
        channels(input: $input) {
          id name service isDisconnected isLocked isQueuePaused organizationId
        }
      }`,
      { input: { organizationId: organization.id, filter: { isLocked: false } } },
    );
    const channel = data.channels.find(item => item.service === 'twitter' && !item.isDisconnected);
    if (channel) {
      selected = { organization, channel };
      break;
    }
  }
  if (!selected) throw new Error('No connected, unlocked X/Twitter channel found in Buffer');
  if (selected.channel.isQueuePaused) throw new Error('The Buffer X queue is paused');

  const scheduled = await graphql(
    `query ScheduledPosts($input: PostsInput!, $first: Int) {
      posts(input: $input, first: $first) {
        edges { node { id text dueAt status channelId } }
      }
    }`,
    {
      input: {
        organizationId: selected.organization.id,
        filter: { channelIds: [selected.channel.id], status: ['scheduled', 'sending', 'sent'] },
        sort: [{ field: 'dueAt', direction: 'asc' }],
      },
      first: 50,
    },
  );

  const knownPosts = scheduled.posts.edges.map(edge => edge.node);
  const queued = knownPosts.filter(post => post.status === 'scheduled' || post.status === 'sending');
  const capacity = Math.max(0, MAX_QUEUE - queued.length);
  const existingText = knownPosts.map(post => post.text).join('\n');
  const candidates = loadStories().filter(story =>
    (!targetDate || story.isoDate === targetDate) &&
    !existingText.includes(`/stories/${story.id}/`),
  );
  const stories = candidates.slice(0, Math.min(MAX_PER_RUN, capacity));

  if (!stories.length) {
    console.log(`Nothing queued: ${queued.length}/${MAX_QUEUE} slots are already occupied or all current stories are present.`);
    return;
  }

  const mutation = `mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      __typename
      ... on PostActionSuccess { post { id text dueAt status } }
      ... on InvalidInputError { message }
      ... on LimitReachedError { message }
      ... on NotFoundError { message }
      ... on UnauthorizedError { message }
      ... on UnexpectedError { message }
      ... on RestProxyError { message }
    }
  }`;

  for (const story of stories.reverse()) {
    const imageUrl = `${SITE_URL}/${story.image.replace(/^\//, '')}`;
    const result = await graphql(mutation, {
      input: {
        channelId: selected.channel.id,
        text: postText(story),
        assets: [{ image: { url: imageUrl, thumbnailUrl: imageUrl, metadata: { altText: story.title } } }],
        metadata: { twitter: { isAiGenerated: true } },
        mode: shareMode,
        schedulingType: 'automatic',
        needsApproval: false,
        saveToDraft: false,
        aiAssisted: true,
        source: 'blappos-github-actions',
      },
    });
    const payload = result.createPost;
    if (payload.__typename !== 'PostActionSuccess') {
      throw new Error(`Buffer rejected ${story.id}: ${payload.message || payload.__typename}`);
    }
    console.log(`Queued ${story.id} as Buffer post ${payload.post.id} for ${payload.post.dueAt}`);
  }
}

await main();
