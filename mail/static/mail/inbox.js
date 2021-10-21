document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email(''));

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(email) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-entry-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = (email) ? email.sender : '';
  document.querySelector('#compose-subject').value = (email) ? prefill_subject(email.subject) : '';
  document.querySelector('#compose-body').value = (email) ? prefill_body(email) : '';

  document.querySelector('#compose-form').onsubmit = submit_mail;
}

function prefill_subject(subject) {
  if (subject.slice(0,4) === "Re: ") {
    return subject;
  } else {
    return `Re: ${subject}`;
  }
}

function prefill_body(email) {
  return `On ${email.timestamp} ${email.sender} wrote: ${email.body}`
}

function submit_mail() {

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  });

}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-entry-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      emails.forEach(add_mail, mailbox);
    });
}

function add_mail(email) {

  mailbox = this.valueOf();

  const mail_entry = document.createElement('div');
  mail_entry.className = 'email-entry';
  mail_entry.innerHTML = `<div class="row mb-0"><div class="col-md-8"><em>${email.sender}</em></div><div class="col-md-4 email-timestamp"><span>${email.timestamp}</span></div></div><span class="h4">${email.subject}</span>`;

  if (email.read) {
    mail_entry.style.background = 'grey';
  } else {
    mail_entry.style.background = 'white';
  }

  mail_entry.addEventListener('click', function() {

    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    });

    fetch(`/emails/${email.id}`)
      .then(response => response.json())
      .then(email => {
        view_mail(email, mailbox);
      });

  });

  document.querySelector('#emails-view').append(mail_entry);

}

function view_mail(email, mailbox) {

  document.querySelector('#email-entry-view').innerHTML = '';

  // Show the mail view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-entry-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  const header = document.createElement('div');
  header.className = 'email-header';

  const arch_btn_text = email.archived ? "Unarchive" : "Archive";

  header.innerHTML = `<strong>From: </strong>${email.sender}<br>
                      <strong>To: </strong>${email.recipients}<br>
                      <strong>Suject: </strong>${email.subject}<br>
                      <strong>Timestamp: </strong>${email.timestamp}<br>
                      <button class="btn btn-sm btn-outline-primary" id="reply">Reply</button> `;

  if (mailbox != 'sent'){
    header.innerHTML += `<button class="btn btn-sm btn-outline-primary" id="archive">${arch_btn_text}</button>`;
  }
  header.innerHTML += `<hr><p>${email.body}</p>`;

  document.querySelector('#email-entry-view').append(header);

  document.querySelector('#reply').addEventListener('click', () => compose_email(email));
  if (mailbox !== 'sent') {
    document.querySelector('#archive').addEventListener('click', () => toggle_archive(email));
  }

}

function toggle_archive(email) {

  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: !email.archived
    })
  })
  .then(location.href = "");

}