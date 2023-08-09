import './styles.scss';
import 'bootstrap';
import * as yup from 'yup';
import isEmpty from 'lodash/isEmpty.js';
import elements from './elements.js';
import { watchedState, state } from './render.js';

// import keyBy from 'lodash/keyBy.js';

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

elements.form.addEventListener('submit', (e) => {
  e.preventDefault();
  watchedState.RSSform.data.url = elements.input.value;
  const errorsPromise = validate(watchedState.RSSform.data)
    .then((errors) => {
      watchedState.RSSform.errors = errors.join();
      if (isEmpty(errors)) {
        watchedState.RSSform.state = 'valid';
        watchedState.RSSfeeds.urls.push(watchedState.RSSform.data.url);
      } else {
        watchedState.RSSform.state = 'invalid';
      }
      console.log(state);
    });
  return errorsPromise;
});
