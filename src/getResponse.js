import axios from 'axios';

// const getResponse = (url) => {
//   console.log('getting response');
//   const promise = axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${url}`)
//     .then((result) => result)
//     .catch(() => {
//       throw new Error('errorNetwork');
//     });
//   return promise;
// };

const getResponse = (url) => {
  console.log('getting response');
  return axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${url}`);
};

export default getResponse;
