# 🎓 AttendMe - Aplikacja do sprawdzania obecności

AttendMe to aplikacja webowa ułatwiająca sprawdzanie obecności na zajęciach akademickich. Studenci rejestrują swoją obecność poprzez generowanie kodu QR, który wykładowcy skanują za pomocą aplikacji.

## 🚀 Technologie
Projekt wykorzystuje nowoczesne technologie front-endowe:
- 🌟 **Vue 3** + TypeScript
- 🔀 **Vue Router** (nawigacja)
- 📦 **Pinia** (zarządzanie stanem)
- 📸 **vue-qrcode-reader** (skanowanie kodów QR)
- 🔗 **NSwagStudio** (wygenerowana biblioteka kliencka do komunikacji z backendem)
- 🎨 CSS (bez dodatkowych frameworków UI)

## 🛠️ Instalacja i uruchomienie
1. **Sklonuj repozytorium**:
 ```sh
git clone https://github.com/Dexamethason/attendme.git
```
2. Przejdź do katalogu projektu:
```sh
cd attendme
```

Zainstaluj zależności:
```sh
npm install
```
Uruchom aplikację w trybie deweloperskim:
```sh
npm run dev
```

## 📌 Kluczowe funkcjonalności (wymagane minimum)
✅ Logowanie użytkownika (JWT)

✅ Pulpit wykładowcy z listą zajęć

✅ Ekran szczegółów zajęć z listą obecności

✅ Funkcja skanowania kodów QR (wykładowca)

✅ Pulpit studenta z listą zajęć

✅ Generowanie kodu QR do rejestracji obecności (student)

✅ Ekran szczegółów zajęć (frekwencja, historia obecności)

## Autorzy:
- Jakub Rogula
- Daniel Koćma
- Bartek Prześlak
