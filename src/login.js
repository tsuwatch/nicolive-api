import request from 'request';

export default function login(email, password) {
  return new Promise((resolve, reject) => {
    request.post(
      {
        url: 'https://secure.nicovideo.jp/secure/login',
        form: {
          mail_tel: email,
          password
        }
      }
      , ((err, res) => {
        if (err) reject(err);

        const cookies = res.headers['set-cookie'];
        const cookie = cookies.find((cookie => cookie.indexOf('user_session=user_session') === 0)) || '';
        const cookieValue = cookie.slice(0, cookie.indexOf(';') + 1)
        if (!cookieValue) reject('Invalid user');
        resolve(cookieValue);
      })
    );
  });
}
