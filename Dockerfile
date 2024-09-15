FROM golang:1.23.0 as builder

# Create and change to the app directory.
WORKDIR /app

# Retrieve application dependencies using go modules.
# Allows container builds to reuse downloaded dependencies.
COPY ./server/go.* ./
RUN go mod download

# Copy local code to the container image.
COPY ./server/* ./

# Build the binary.
# -mod=readonly ensures immutable go.mod and go.sum in container builds.
RUN CGO_ENABLED=0 GOOS=linux go build -mod=readonly -v -o server

FROM alpine:3.10

RUN apk add --no-cache ca-certificates

COPY --from=builder /app/server /server
# COPY index.html ./index.html
# COPY assets/ ./assets/
EXPOSE 8080
# Run the web service on container startup.
CMD ["/server"]