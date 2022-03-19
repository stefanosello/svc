import axios from 'axios';

class ApiService {
    clientId;
    constructor() {
        this.clientId = undefined;
     }

    init(baseUrl) {
        axios.defaults.baseURL = baseUrl;
    }

    updateClientId(clientId) {
        if (clientId) {
            this.clientId = clientId;
        }
    }

    post(path, data) {
        return axios.post(path, { ...data, clientId: this.clientId } );
    }
}

export default new ApiService();