const parseRSS = (response) => {
  const parser = new DOMParser();
  const content = response.data.contents;
  const doc = parser.parseFromString(content, 'application/xml');
  const items = doc.querySelectorAll('item');
  const posts = [];
  items.forEach((item) => {
    const itemTitle = item.querySelector('title').innerHTML;
    const itemLink = item.querySelector('link').innerHTML;
    posts.push({ itemTitle, itemLink });
  });
  const result = {
    feed: {
      url: response.data.status.url,
      feedTitle: doc.querySelector('title').innerHTML,
      feedDesc: doc.querySelector('description').innerHTML,
    },
    posts,
  };
  return result;
};

export default parseRSS;
