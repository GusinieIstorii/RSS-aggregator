import onChange from 'on-change';
import elements from './elements.js';

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
  
  const render = () => {
    if (state.RSSform.state === 'valid') {
      elements.input.classList.remove('is-invalid');
      elements.form.reset();
      elements.input.focus();
    }
    if (state.RSSform.state === 'invalid') {
      elements.input.classList.add('is-invalid');
      elements.input.value = watchedState.RSSform.data.url;
    }
  };
  
  const watchedState = onChange(state, render);

  export { watchedState, state };