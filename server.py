import json
import os
import smtplib
from email.message import EmailMessage
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

WORKSPACE_DIR = Path(__file__).resolve().parent
HTML_DIR = WORKSPACE_DIR
PORT = int(os.environ.get('PORT', '8000'))

SMTP_HOST = os.environ.get('SMTP_HOST')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USER = os.environ.get('SMTP_USER')
SMTP_PASS = os.environ.get('SMTP_PASS')
SMTP_FROM = os.environ.get('SMTP_FROM') or SMTP_USER
SMTP_TO = os.environ.get('SMTP_TO', 'ywis@o2.pl')


class ContactHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(HTML_DIR), **kwargs)

    def do_GET(self):
        if self.path == '/api/health':
            self._send_json(200, {'status': 'ok'})
            return

        super().do_GET()

    def do_POST(self):
        parsed_path = urlparse(self.path)

        if parsed_path.path != '/api/contact':
            self._send_json(404, {'error': 'Not found'})
            return

        content_length = int(self.headers.get('Content-Length', '0'))
        body = self.rfile.read(content_length) if content_length else b''

        try:
            data = self._parse_body(body, self.headers.get('Content-Type', ''))
        except Exception as exc:
            self._send_json(400, {'error': f'Niepoprawne dane formularza: {exc}'})
            return

        required_fields = ['name', 'email', 'subject', 'message']
        missing = [field for field in required_fields if not str(data.get(field, '')).strip()]

        if missing:
            self._send_json(400, {'error': 'Uzupełnij wszystkie pola formularza.'})
            return

        try:
            self._send_contact_email(data)
        except Exception as exc:
            self._send_json(500, {'error': f'Nie udało się wysłać wiadomości: {exc}'})
            return

        self._send_json(200, {'success': True, 'message': 'Wiadomość została wysłana.'})

    def _parse_body(self, body: bytes, content_type: str):
        if not body:
            return {}

        if 'application/json' in content_type:
            try:
                return json.loads(body.decode('utf-8'))
            except json.JSONDecodeError as exc:
                raise ValueError('Błąd parsowania JSON') from exc

        form_data = parse_qs(body.decode('utf-8'))
        return {key: values[0] if values else '' for key, values in form_data.items()}

    def _send_contact_email(self, data):
        name = str(data['name']).strip()
        email = str(data['email']).strip()
        subject = str(data['subject']).strip()
        message = str(data['message']).strip()

        if not all([SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_TO]):
            raise RuntimeError('Brakuje konfiguracji SMTP. Ustaw zmienne środowiskowe: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_TO.')

        msg = EmailMessage()
        msg['Subject'] = f'[StronaMetal] {subject}'
        msg['From'] = SMTP_FROM or SMTP_USER
        msg['To'] = SMTP_TO
        msg['Reply-To'] = email
        msg.set_content(
            f"Imię i nazwisko: {name}\n"
            f"Email: {email}\n\n"
            f"Temat: {subject}\n\n"
            f"Wiadomość:\n{message}"
        )

        if SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT)
        else:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
            server.starttls()

        try:
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        finally:
            server.quit()

    def _send_json(self, status_code: int, payload: dict):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        return


if __name__ == '__main__':
    try:
        server = ThreadingHTTPServer(('0.0.0.0', PORT), ContactHandler)
        print(f'Server działa na http://localhost:{PORT}')
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nZatrzymano serwer.')
