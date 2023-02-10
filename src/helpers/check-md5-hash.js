var digestStream = require('digest-stream')

function checkMd5Hash(req) {
  const contentMd5 = req.headers['content-md5'];

  if (!contentMd5) return;

  req.pipe(
    digestStream('md5', 'hex', (resultDigest) => {
      if (contentMd5 !== resultDigest) {
        throw { code: 'BadDigest', message: 'md5 hash mismatch' };
      }
    }),
  );
}

module.exports = checkMd5Hash;
