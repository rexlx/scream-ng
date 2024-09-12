the desktop version of [scream](https://github.com/rexlx/scream). with e2e encoding.

the app comes with 4 keys. to load in your own key dictionary create a file with the following contents (with the exeption of value in parentheses):
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