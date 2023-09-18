const removeCdata = (xmlString) => {
  const regex = /<!\[CDATA\[|\]\]>/g;
  return xmlString.replace(regex, '');
};

const parseRSS = (response) => {
  const parser = new DOMParser();
  try {
    const content = removeCdata(response.data.contents);
    const doc = parser.parseFromString(content, 'application/xml');
    const items = doc.querySelectorAll('item');
    const posts = [];
    items.forEach((item) => {
      const itemTitle = item.querySelector('title').textContent;
      const itemLink = item.querySelector('link').textContent;
      const itemDesc = item.querySelector('description').textContent;
      posts.push({ itemTitle, itemLink, itemDesc });
    });
    const result = {
      feed: {
        feedTitle: doc.querySelector('title').textContent,
        feedDesc: doc.querySelector('description').textContent,
      },
      posts,
    };
    return result;
  } catch (e) {
    throw new Error('parsing error');
  }
};

export default parseRSS;
