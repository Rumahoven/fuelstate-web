/* Fuelstate waitlist — posts directly to Supabase REST with the public anon key.
   Inserts are gated by an insert-only RLS policy on the `waitlist` table. */

const SUPABASE_URL  = "https://bghekdandbybblhwjjgc.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnaGVrZGFuZGJ5YmJsaHdqamdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MjYyMTcsImV4cCI6MjA5MDMwMjIxN30.L47v33gKroXH7L-1AdDcxBFsO49nIjKAx6XEIE49ozI";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const form   = document.getElementById("waitlist-form");
const input  = document.getElementById("waitlist-email");
const button = document.getElementById("waitlist-submit");
const status = document.getElementById("waitlist-status");
const buttonLabel = button?.querySelector("span");

function setStatus(msg, state) {
  status.textContent = msg;
  if (state) status.dataset.state = state;
  else delete status.dataset.state;
}

async function submitWaitlist(email) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      email: email.toLowerCase(),
      source: "fuelstate.app",
      user_agent: navigator.userAgent.slice(0, 200),
      referrer: document.referrer ? document.referrer.slice(0, 200) : null,
    }),
  });
  return res;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = input.value.trim();
  if (!EMAIL_RE.test(email)) {
    setStatus("Please enter a valid email address.", "err");
    input.focus();
    return;
  }

  button.disabled = true;
  const original = buttonLabel ? buttonLabel.textContent : button.textContent;
  if (buttonLabel) buttonLabel.textContent = "Joining…";
  else button.textContent = "Joining…";
  setStatus("", null);

  try {
    const res = await submitWaitlist(email);
    if (res.ok || res.status === 201 || res.status === 204) {
      setStatus("You're on the list. We'll be in touch.", "ok");
      form.reset();
      if (buttonLabel) buttonLabel.textContent = "On the list";
      else button.textContent = "On the list";
    } else if (res.status === 409) {
      setStatus("This email is already on the waitlist.", "ok");
      if (buttonLabel) buttonLabel.textContent = original;
      else button.textContent = original;
    } else {
      const text = await res.text().catch(() => "");
      console.error("waitlist error", res.status, text);
      setStatus("Something went wrong. Try again in a moment.", "err");
      if (buttonLabel) buttonLabel.textContent = original;
      else button.textContent = original;
    }
  } catch (err) {
    console.error(err);
    setStatus("Network error. Check your connection and retry.", "err");
    if (buttonLabel) buttonLabel.textContent = original;
    else button.textContent = original;
  } finally {
    button.disabled = false;
  }
});
