import './styles.scss';
import 'bootstrap';

import * as yup from 'yup';
import keyBy from 'lodash/keyBy.js';
import isEmpty from 'lodash/isEmpty.js';
import onChange from 'on-change';

const state = {
  RSSform: {
    state: 'valid',
    data: {
      url: '',
    },
    errors: {},
  },
  RSSfeeds: {
    urls: ['aaa'],
  },
};

const elements = {
  input: document.querySelector('.form-control'),
}

const render = () => {
  if (state.RSSform.state === 'valid') {
    elements.input.classList.remove('is-invalid');
  }
  if (state.RSSform.state === 'invalid') {
    elements.input.classList.add('is-invalid');
  }
};

const watchedState = onChange(state, render);

const schema = yup.object({
  url: yup.string()
    .url()
    .nullable()
    .notOneOf(watchedState.RSSfeeds.urls), // как сделать валидацию на каждый вызов функции с учетом обновления списка? то есть с дефолтным 'aaa' сравнение идет, а добавление новых ссылок на валидацию не влияет?
});

async function validate(fields) {
  try {
    await schema.validate(fields); 
    return {};
  } catch (e) {
    console.log(e.errors);
    return (e.errors);
  }
};

const form = document.querySelector('.rss-form');
form.addEventListener('submit', async(e) => {
  e.preventDefault();
  watchedState.RSSform.data.url = elements.input.value;
  const errors = await validate(watchedState.RSSform.data);
  console.log(errors);
  watchedState.RSSform.errors = errors;
  if (isEmpty(errors)) {
    watchedState.RSSform.state = 'valid';
    watchedState.RSSfeeds.urls.push(watchedState.RSSform.data.url);
  } else {
    watchedState.RSSform.state = 'invalid';
  }
  console.log(state);
});

// error here, need to validate the updated list of urls
// работает но сравнение с урлами происходит в самом начале и потом не обновляется
// const validate = (fields) => {
//   try {
//     schema.validateSync(fields, { abortEarly: false }); // async operation or what?
//     return {};
//   } catch (e) {
//     console.log(e);
//     return keyBy(e.inner, 'path');
//   }
// };

// const form = document.querySelector('.rss-form');
// form.addEventListener('submit', (e) => {
//   e.preventDefault();
//   watchedState.RSSform.data.url = elements.input.value;
//   const errors = validate(watchedState.RSSform.data);
//   console.log(errors);
//   watchedState.RSSform.errors = errors;
//   if (isEmpty(errors)) {
//     watchedState.RSSform.state = 'valid';
//     watchedState.RSSfeeds.urls.push(watchedState.RSSform.data.url);
//   } else {
//     watchedState.RSSform.state = 'invalid';
//   }
//   console.log(state);
// });



// await schema.validate(watchedState.RSSform.data)
// const errors = await schema.validate(watchedState.RSSform.data);