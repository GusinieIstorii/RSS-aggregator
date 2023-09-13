import axios from 'axios';

const getResponse = (url) => {
  const promise = axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${url}`)
    .then((result) => result)
    .catch(() => 'http request error');
  return promise;
};

export default getResponse;
