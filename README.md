the desktop version of [scream](https://github.com/rexlx/scream). with e2e encoding.

## server part
you will need tls certs. see data/ssl_gen.sh for an example if you have openssl. you will need go to compile and run the server. this is the url you will be configuring on the frontend.

```
cd server/
go build .
./ritterserver -h
```
## first user
edit and run server/create_user.sh to create your first user

## frontend part
configure the https://host:port and wss://host:port lines  in index.html with the backend url. and this line in `render.js`: `const app = new Applcation("https://localhost:8080", "admin");`

```
npm run start
```

### about keys

the app comes with 4 keys. to load in your own key dictionary create a file with the following contents (with the exeption of value in parentheses):
remove keys all together to disable encryption
```
(first line)[
  {
    "name": "malfunctioning-unapproachability",
    "key": "Em9k8X2SsEDHbC6mF9jwBug8BGfLYC2TR97hzKzCaAY="
  },
  {
    "name": "tegular-peripatopsidae",
    "key": "eOSPDQfRMp+RwOKE4v7TQc5yGgeg2ABQ23pjWg8kWAg="
  },
(last line)]
```

where the key is a 32 byte (or 16 technically) value. below is an example of how i create keys [elsewhere](https://github.com/rexlx/dieScribe).
```go
func MakeKey() ([]byte, error) {
    // create 32 byte buffer
	tmp := make([]byte, 32)
    // populate with random data until full
	if _, err := io.ReadFull(rand.Reader, tmp); err != nil {
		return nil, err
	}
	return tmp, nil
}
```