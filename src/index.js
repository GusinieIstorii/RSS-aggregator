import './styles.scss';
import 'bootstrap';
import * as yup from 'yup';
import isEmpty from 'lodash/isEmpty.js';
import axios from 'axios';
import parseRSS from './parseRSS.js';
import elements from './elements.js';
import { watchedState, state } from './render.js';

const validate = (fields) => {
  const schema = yup.object({
    url: yup.string()
      .url()
      .nullable()
      .notOneOf(watchedState.RSSfeeds.urls, 'url must not be one of the following values'),
  });

  const promise = schema.validate(fields)
    .then(() => [])
    .catch((e) => e.errors);

  return promise;
};

// const getRSSresponse = (url) => {
//   const responsePromise = axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${url}`)
//     .then((response) => {
//       console.log(response);
//       return response;
//     })
//     .catch((er) => {
//       console.log(er.errors);
//       return (er.errors);
//     });
//   return responsePromise;
// };

elements.form.addEventListener('submit', (e) => {
  e.preventDefault();
  watchedState.RSSform.data.url = elements.input.value;
  const errorsPromise = validate(watchedState.RSSform.data)
    .then((validationErrors) => {
      watchedState.RSSform.errors = validationErrors.join();
      if (isEmpty(validationErrors)) {
        // здесь кажется не хватает асинхронности ???
        axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${watchedState.RSSform.data.url}`)
          .then((response) => {
            const parsedResponse = parseRSS(response);
            watchedState.RSSform.state = 'valid';
            watchedState.RSSfeeds.urls.push(watchedState.RSSform.data.url);
            watchedState.RSSfeeds.feeds.push(parsedResponse.feed);
            watchedState.RSSfeeds.posts.push(parsedResponse.posts);
            watchedState.RSSfeeds.posts = watchedState.RSSfeeds.posts.flat();
            return parsedResponse;
          })
          .catch((er) => {
            watchedState.RSSform.errors = 'parsing error';
            return (er.errors);
          });
        // return responsePromise;
      } else {
        watchedState.RSSform.state = 'invalid';
      }
    });

  console.log(state);
  return errorsPromise;
});
