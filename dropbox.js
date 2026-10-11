
const { Dropbox } = require("dropbox");

let dropboxClient;

function connectDropbox() {
  const token = process.env.DROPBOX_ACCESS_TOKEN;

  if (!token) {
    throw new Error("Please configure DROPBOX_ACCESS_TOKEN in .env");
  }

  dropboxClient = new Dropbox({
    accessToken: token
  });

  console.log("Dropbox connected successfully!");
  return dropboxClient;
}

function getDropbox() {
  if (!dropboxClient) {
    throw new Error("Dropbox is not connected");
  }

  return dropboxClient;
}

module.exports = {
  connectDropbox,
  getDropbox
};
