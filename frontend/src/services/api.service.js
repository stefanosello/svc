import axios from 'axios';

const ApiService = {
    init(baseUrl) {
        axios.defaults.baseURL = baseUrl;
    },

    post(path, data) {
        return axios.post(path, data);
    }
};

export { ApiService }