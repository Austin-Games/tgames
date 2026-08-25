(() => {
  "use strict";

  const form = document.getElementById("proxyForm");
  const input = document.getElementById("url");
  const button = document.getElementById("go");
  const status = document.getElementById("status");
  const viewer = document.getElementById("viewer");

  // Keep the visible content family-friendly.
  const BAD_WORDS = [
    "fuck", "fucker", "fucking", "shit", "bitch", "asshole",
    "bastard", "dick", "piss", "cunt", "slut", "whore"
  ];

  function cleanText(text) {
    let result = text || "";
    for (const word of BAD_WORDS) {
      const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, "gi");
      result = result.replace(re, "[filtered]");
    }
    return result;
  }

  function sanitizeDocument(html, baseUrl) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Never execute remote page code in this viewer.
    doc.querySelectorAll("script, iframe, frame, frameset, object, embed, form, input, button, textarea, select, meta[http-equiv]")
      .forEach(el => el.remove());

    doc.querySelectorAll("*").forEach(el => {
      for (const attr of [...el.attributes]) {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim();
        if (name.startsWith("on") || name === "srcdoc") el.removeAttribute(attr.name);
        if ((name === "href" || name === "src") && /^javascript:/i.test(value)) el.removeAttribute(attr.name);
      }
      if (el.childNodes.length === 1 && el.firstChild.nodeType === Node.TEXT_NODE) {
        el.firstChild.nodeValue = cleanText(el.firstChild.nodeValue);
      }
    });

    // Rewrite relative links to absolute URLs and prevent navigation out of the viewer.
    doc.querySelectorAll("a[href]").forEach(a => {
      try {
        a.href = new URL(a.getAttribute("href"), baseUrl).href;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      } catch (_) {
        a.removeAttribute("href");
      }
    });

    doc.querySelectorAll("img[src]").forEach(img => {
      try { img.src = new URL(img.getAttribute("src"), baseUrl).href; }
      catch (_) { img.removeAttribute("src"); }
    });

    return doc.body.innerHTML;
  }

  async function openUrl(rawUrl) {
    let target;
    try {
      target = new URL(rawUrl);
      if (!/^https?:$/.test(target.protocol)) throw new Error("Only HTTP and HTTPS URLs are supported.");
    } catch (error) {
      throw new Error("Please enter a valid http:// or https:// URL.");
    }

    // allorigins is used only as the fetch transport because browsers block
    // cross-origin reads from arbitrary websites without CORS permission.
    const endpoint = "https://api.allorigins.win/raw?url=" + encodeURIComponent(target.href);
    const response = await fetch(endpoint, { headers: { Accept: "text/html,text/plain;q=0.9,*/*;q=0.8" } });
    if (!response.ok) throw new Error(`Proxy request failed (${response.status}).`);

    const html = await response.text();
    viewer.innerHTML = sanitizeDocument(html, target.href);
    status.textContent = `Showing a cleaned copy of ${target.href}`;
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    button.disabled = true;
    viewer.innerHTML = "";
    status.textContent = "Loading…";
    try {
      await openUrl(input.value.trim());
    } catch (error) {
      status.textContent = error.message || "Unable to load that website.";
      viewer.innerHTML = "<p>Unable to load this site. Some websites block proxy access or require features this safe reader does not provide.</p>";
    } finally {
      button.disabled = false;
    }
  });
})();
