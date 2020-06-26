# `csrf-example`

This is an example of setting a CSRF token in a cookie and then sending the token back to the server
in a header.

The idea for this project came from [this post](https://dev.to/_smellycode/csrf-in-action-21n3) on
Dev.to.

## CSRF Protection

A lot of web frameworks incorporate some form of CSRF protection, typically by generating a token
and storing it in a hidden form input field when the page with the form is rendered. When the form
is submitted, the token is sent and verified by the server before processing the request.

It becomes slightly trickier when using single-page apps with a single `index.html`, especially if
the app isn't served by your backend server.

The way Angular's HTTP client handles this is by looking for a cookie named `xsrf-token` and then
sending a `x-xsrf-token` header with the token as the value. Your server then looks for that header
and verifies it before processing the request. This works because scripts on the attacking website
cannot read the cookies for your website and thus set the header.

When using JWTs, you can take this a step further by putting the CSRF token in the payload of the
JWT and then verifying that the payload token and header tokens match. This would be a form of the
[double-submit cookie technique](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie).

Another way to prevent CSRF attacks is to check the `Referrer` header set by the browser. This will
work most of the time, but there are situations where the header could be omitted or stripped. For
example, I use the AdGuard ad-blocker which has an option to strip this header from all outbound
requests for privacy.

## Cookies

The attack in this example works because even though the _origin_ is different (i.e.,
`localhost:3000` is not the same as `localhost:3002`), the _domain_ is the same (i.e., `localhost`).

If you change either the client or the attacker to `127.0.0.1` instead of `localhost`, the attack
wont work. This is because cookies can be cross-origin, but not cross-domain. When you do not
explicitly set the `domain` for a cookie, the browser sets it to the current domain.

Note that when you do set the domain, all subdomains can use the cookie as well. You can go a step
further and set the `secure` property on the cookie, to ensure that the browser only stores the
cookie if it came from a secure origin (HTTPS).

## Instructions

In this example we have 3 Express servers: client (port 3000), server (port 3001), and attacker
(port 3002). Because an origin is defined by the scheme, hostname, and port, these servers are
effectively on different origins.

The client is simply an HTML page with some buttons that trigger cross-origin AJAX requests to the
server.

The server has 2 protected endpoints: `/account` and `/account/insecure`. The first endpoint checks
for the `x-xsrf-token` header as well as the `token` cookie. The second endpoint only checks for the
cookie.

The attacker has a hidden `iframe` and 2 forms. The first form sends a request to `/account` while
the second form sends a request to `/account/insecure`.

On the client, you can click the Login button to send a request for the token cookies. Once you have
the tokens, you can switch to a new browser tab and open up the attacker website. You can then see
that requests to `/account` are forbidden, but requests to `/account/insecure` are allowed.

After running **`npm install`** you can run **`npm start`** to start both servers. Then go to
<http://localhost:3000> and <http://localhost:3002> in separate browser tabs.

## Notes

This is obviously a simple example, but the takeaway should be that adding some form of CSRF
protection is not difficult.

This particular implementation of sending the CSRF token as a cookie was based on the Angular
documentation, but it's worth mentioning that OWASP recommends **not** doing this. Rather, they
recommend sending the token in a response header. For example, on every page load you could send a
request to an endpoint that responds with the header and then store the token from the header in
application state. You really need to find a balance between security, usability, and developer
experience, otherwise you'll end up going in circles.

## References

  * [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
  * [PillarJS Understanding CSRF](https://github.com/pillarjs/understanding-csrf)
  * [Angular XSRF Protection](https://angular.io/guide/http#security-xsrf-protection)
  * [MDN Access-Control-Allow-Credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials)
  * [MDN Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin)
