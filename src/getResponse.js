import axios from 'axios';

const getResponse = (url) => axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${url}`);

export default getResponse;
