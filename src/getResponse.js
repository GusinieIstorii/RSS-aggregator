import axios from 'axios';

const getResponse = (url) => {
  console.log('getting response');
  const promise = axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${url}`)
    .then((result) => result)
    .catch(() => {
      throw new Error('netWork error');
    });
  return promise;
};

export default getResponse;
