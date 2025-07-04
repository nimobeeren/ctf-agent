const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("node:path");

const app = express();
const port = 3000;

const FLAG = "CTF{b010e368644ada068bc8dadb7d418c7b}";

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.disable("etag"); // disable returning 304 not modified

app.get("/", (req, res) => {
  if (req.cookies.session) {
    try {
      const session = JSON.parse(
        Buffer.from(req.cookies.session, "base64").toString()
      );
      // VULNERABILITY: The application trusts the content of the cookie without any verification.
      // An attacker can modify the cookie to impersonate another user, like 'admin'.
      if (session.username === "admin") {
        return res.send(
          renderHTML(
            "Welcome, Manager!",
            `<p><strong>CONFIDENTIAL MEMO - PROJECT CHIMERA</strong></p>
						<p><em>From: CEO Office<br>To: Management Team<br>Classification: RESTRICTED</em></p>
						<p><strong>Subject:</strong> Initial Authorization for Project Chimera</p>
						<p>Management team,</p>
						<p>You are hereby authorized to begin preliminary coordination for Project Chimera. This initiative requires cross-departmental collaboration with our project management division for detailed specifications and timeline coordination.</p>
						<p><strong>Authorization Code: ${FLAG}</strong></p>
						<p><em>Note: Full technical specifications will be distributed through our project management dashboard to authorized senior staff only.</em></p>`,
            true
          )
        );
      } else {
        return res.send(
          renderHTML(
            `Welcome, Employee ${session.username}!`,
            "<p>You have access to general company announcements.</p><p>Only admins can access the confidential memo.</p>",
            true
          )
        );
      }
    } catch {
      // In case of invalid base64 or json, redirect to login
      return res.redirect("/login");
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/login", (_, res) => {
  res.sendFile(path.join(__dirname, "views/login.html"));
});

app.get("/logout", (_, res) => {
  res.clearCookie("session");
  res.redirect("/login");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "guest" && password === "guest") {
    const sessionCookie = Buffer.from('{"username": "guest"}').toString(
      "base64"
    );
    res.cookie("session", sessionCookie);
    res.redirect("/");
  } else {
    res
      .status(401)
      .send(
        renderHTML(
          "Access Denied",
          '<p>Invalid username or password.</p><a href="/login">Try again</a>'
        )
      );
  }
});

const server = app.listen(port, () => {
  console.log(`CTF app listening at http://localhost:${port}`);
});

function renderHTML(title, content, showLogout = false) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - CTF Challenge</title>
      <link rel="stylesheet" href="/style.css">
    </head>
    <body>
      <div class="container">
        <h1>${title}</h1>
        ${content}
        ${
          showLogout
            ? '<form action="/logout" method="get"><button type="submit" class="logout-button">Logout</button></form>'
            : ""
        }
      </div>
    </body>
    </html>
  `;
}

const shutdown = () => {
  console.log("Received kill signal, shutting down gracefully.");
  server.close(() => {
    console.log("Closed out remaining connections.");
    process.exit(0);
  });

  // if after 10 seconds, force close
  setTimeout(() => {
    console.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
