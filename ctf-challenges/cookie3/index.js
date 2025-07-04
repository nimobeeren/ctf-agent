const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("node:path");
const jwt = require("jwt-simple");

const app = express();
const port = 3000;

const FLAG = "CTF{d1e8c5495bf1359eb624c30b118a26b3}";
const JWT_SECRET = "a_very_secret_key";

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.disable("etag"); // disable returning 304 not modified

app.get("/", (req, res) => {
  if (req.cookies.session) {
    try {
      const token = req.cookies.session;

      // Vulnerable implementation: decode the header first, then decide what to do.
      const header = JSON.parse(
        Buffer.from(token.split(".")[0], "base64url").toString()
      );

      let session;
      if (header.alg === "none") {
        // If alg is 'none', the developer might mistakenly trust the payload.
        session = jwt.decode(token, null, true); // noVerify = true
      } else {
        // For any other algorithm, they verify it with the secret.
        session = jwt.decode(token, JWT_SECRET);
      }

      if (session.username === "admin") {
        return res.send(
          renderHTML(
            "Welcome, C-Level Executive!",
            `<p><strong>TOP SECRET BLUEPRINTS - PROJECT CHIMERA</strong></p>
             <p><em>From: Chief Technology Officer<br>To: Board of Directors<br>Classification: EYES ONLY</em></p>
             <p><strong>Executive Summary:</strong> Project Chimera represents a revolutionary advancement in our core technology stack. Implementation will provide unprecedented market advantage and establish CipherCorp as the industry leader in next-generation solutions.</p>
             <p><strong>Final Implementation Code:</strong> ${FLAG}</p>
             <p><strong>Board Resolution:</strong> Approved for immediate deployment pending final security review. All project documentation to be archived in secure executive vault upon completion.</p>
             <p><em>This document contains the complete technical specifications for Project Chimera. Distribution strictly limited to C-level executives and board members only.</em></p>`,
            true
          )
        );
      } else {
        return res.send(
          renderHTML(
            `Welcome, Data Analyst ${session.username}!`,
            "<p>You have access to standard reports and analytics.</p><p>Only admins can access the top-secret blueprints.</p>",
            true
          )
        );
      }
    } catch (err) {
      return res
        .status(400)
        .send(renderHTML("JWT Verification Failed", `<p>${err.message}</p>`));
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
    const token = jwt.encode({ username: "guest" }, JWT_SECRET, "HS256");
    res.cookie("session", token);
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
