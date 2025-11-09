import React, { useRef } from "react";
import emailjs from "emailjs-com";

export default function ContactForm() {
  const form = useRef();

  const sendEmail = (e) => {
    e.preventDefault();

    emailjs.sendForm(
      "service_c74h84k",      // replace with your EmailJS service ID
      "template_ndlemde",     // replace with your template ID
      form.current,
      "TUaWuGFKzMEYeVvAA"       // replace with your EmailJS public key
    )
    .then((result) => {
        console.log("Email sent:", result.text);
        alert("Email sent to user successfully!");
    }, (error) => {
        console.log("Error:", error.text);
        alert("Failed to send email.");
    });
  };

  return (
    <form ref={form} onSubmit={sendEmail} style={{ maxWidth: "500px", margin: "0 auto" }}>
      <div>
        <label>Name:</label>
        <input type="text" name="name" placeholder="Your Name" required />
      </div>
      <div>
        <label>Email:</label>
        <input type="email" name="email" placeholder="Your Email" required />
      </div>
      <div>
        <label>Title:</label>
        <input type="text" name="title" placeholder="Email Subject" required />
      </div>
      <div>
        <label>Message:</label>
        <textarea name="message" placeholder="Your Message" required />
      </div>
      <button type="submit">Send</button>
    </form>
  );
}
