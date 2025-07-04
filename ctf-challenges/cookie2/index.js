const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("node:path");
const crypto = require("node:crypto");

const app = express();
const port = 3000;

const FLAG = "CTF{739aaa16c7fef1c6e85d6f6ed673b8a7}";

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.disable("etag"); // disable returning 304 not modified

app.get("/", (req, res) => {
  if (req.cookies.session && req.cookies.integrity) {
    try {
      const session = JSON.parse(
        Buffer.from(req.cookies.session, "base64").toString()
      );
      const integrity = req.cookies.integrity;
      const expectedIntegrity = crypto
        .createHash("sha256")
        .update(req.cookies.session)
        .digest("hex");

      if (integrity !== expectedIntegrity) {
        return res
          .status(400)
          .send(
            renderHTML(
              "Integrity Check Failed",
              "<p>The cookie has been tampered with.</p>"
            )
          );
      }

      if (session.username === "admin") {
        return res.send(
          renderHTML(
            "Welcome, Senior Manager!",
            `<p><strong>PROJECT SPECIFICATIONS - PROJECT CHIMERA</strong></p>
             <p><em>From: R&D Division<br>To: Senior Management<br>Classification: CONFIDENTIAL</em></p>
             <p><strong>Project Phase:</strong> Development Stage 2</p>
             <p><strong>Timeline:</strong> Q3-Q4 Implementation</p>
             <p><strong>Budget Allocation:</strong> $2.4M approved</p>
             <p><strong>Access Key:</strong> ${FLAG}</p>
             <p><em>IMPORTANT: Complete technical blueprints and implementation details require executive-level clearance. Board presentation scheduled for next quarter pending final approval from C-suite leadership.</em></p>`,
            true
          )
        );
      } else {
        return res.send(
          renderHTML(
            `Welcome, Project Coordinator ${session.username}!`,
            "<p>You have access to general project updates and timelines.</p><p>Only admins can access the detailed project specifications.</p>",
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
  res.clearCookie("integrity");
  res.redirect("/login");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "guest" && password === "guest") {
    const sessionCookie = Buffer.from('{"username": "guest"}').toString(
      "base64"
    );
    const integrity = crypto
      .createHash("sha256")
      .update(sessionCookie)
      .digest("hex");
    res.cookie("session", sessionCookie);
    res.cookie("integrity", integrity);
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
