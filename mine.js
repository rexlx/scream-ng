export class ESQuery {
    constructor(url, size, query) {
        this.store = {};
        this.store.results = [];
        this.store.errors = [];
        this.url = url;
        this.size = size;
        this.query = {
            "query": {
                "query_string": {
                    "query": `${query}`
                }
            },
            "size": 1000,
            "sort": [
                {
                    "insert_time": {
                        "order": "desc"
                    }
                }]
        };
    }
    async search(index) {
        try {
           const resp = await fetch(this.url + index + '/_search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.query)
            });
            const status = resp.status;
            const data = await resp.json();
            if (status !== 200) {
                if (status === 400) {
                    this.store.errors.push('Bad Request');
                }
                console.log(data, "Error");
            }
            if (data && data.hits && data.hits.hits) {
                this.store.results = data.hits.hits;
            }
        } catch (error) {
            this.store.errors.push(error);
            console.log(error);
        }
    }
    getResults(limit) {
        return this.store.results.slice(0, limit);
    }
    getErrors() {
        return this.store.errors;
    }
    getSize() {
        return this.store.results.length;
    }
}
// module.exports = ESQuery;