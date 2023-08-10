import './styles.scss';
import 'bootstrap';
import * as yup from 'yup';
import isEmpty from 'lodash/isEmpty.js';
import axios, { isCancel, AxiosError } from 'axios';
import elements from './elements.js';
import { watchedState, state } from './render.js';

const validate = (fields) => {
  const schema = yup.object({
    url: yup.string()
      .url()
      .nullable()
      .notOneOf(watchedState.RSSfeeds.urls),
  });

  const promise = schema.validate(fields)
    .then(() => [])
    .catch((e) => {
      console.log(e.errors);
      return (e.errors);
    });

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

const parse = (response) => {
  const parser = new DOMParser();
  const content = response.data.contents;
  const doc = parser.parseFromString(content, 'text/html');
  console.log(doc);
  const posts = doc.querySelectorAll('item');
  console.log(posts); // nodelist - success
  const list = posts.forEach(() => {
    // const itemTitle = item.querySelector('title').innerHTML;
    // const itemLink = item.querySelector('limk').innerHTML;
    // return { itemTitle, itemLink };
    return 1;
  });
  console.log(list); // undefined ???

  // const result = {
  //   url: response.data.status.url,
  //   feedTitle: doc.querySelector('title').innerHTML,
  //   feedDesc: doc.querySelector('description').innerHTML,
  //   // posts,
  // };
  
  // return result;
};

elements.form.addEventListener('submit', (e) => {
  e.preventDefault();
  watchedState.RSSform.data.url = elements.input.value;
  const errorsPromise = validate(watchedState.RSSform.data)
    .then((errors) => {
      watchedState.RSSform.errors = errors.join();
      if (isEmpty(errors)) {
        watchedState.RSSform.state = 'valid';
        watchedState.RSSfeeds.urls.push(watchedState.RSSform.data.url);
        // здесь кажется не хватает асинхронности
        const responsePromise = axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${watchedState.RSSform.data.url}`)
          .then((response) => {
            console.log(response);
            parse(response);
            return response;
          })
          .catch((er) => {
            console.log(er.errors);
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
