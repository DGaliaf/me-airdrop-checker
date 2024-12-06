# ME CHECKER

**ME CHECKER** is a utility for multithreaded verification of drops on wallets. The program supports various wallet formats and allows customization of multithreading parameters.

## Key Features
- Verifies drops on wallets.
- Supports multiple wallet formats:
  - `sol` (Solana)
  - `evm` (EVM-compatible networks)
  - `btc_hex` (Bitcoin in hex format)
  - `btc_wif` (Bitcoin in WIF format)
- Configurable multithreading for enhanced performance.
- Supports HTTP(S) and Socks(4/5) proxies.

---

## Configuration

The program uses a configuration file with the following parameters:

### Parameters:
- **`main_solana_wallet`**: Private key of the main Solana wallet (required).  
  Used for signing and interacting with the Solana network.

- **`max_threads`**: Maximum number of threads for verification (default: `100`).  
  Adjust based on your hardware capabilities.

### Data Structure:
- **`data/accounts`**: Path to a folder containing files with wallet lists. The files must follow these formats:
  - `sol.txt` — Solana wallets.
  - `evm.txt` — Ethereum/EVM-compatible wallets.
  - `btc_hex.txt` — Bitcoin wallets in hex format.
  - `btc_wif.txt` — Bitcoin wallets in WIF format.

---

## Installation and Launch

### Step 1: Clone the repository
```bash
git clone https://github.com/antidrain-sol/me_checker
cd me-checker
```

### Step 2: Set up the environment
— Install Bun following the instructions at https://bun.sh/docs/installation

### Step 3: Configure the program
- Edit the `data/config.toml` file in the project root and specify the parameters as shown above.
- Add a proxy file `data/proxy.txt`. **MANDATORY!!!**

### Step 4: Run the program
```bash
   bun install
   bun index.ts
```

---

## Usage Example

1. Specify the private key of the main Solana wallet in the config:
   ```ini
   main_solana_wallet = "YOUR_PRIVATE_KEY"
   max_threads = 50
   ```

2. Add wallet files to the `data/accounts` folder:
   ```plaintext
   data/accounts/sol.txt
   data/accounts/evm.txt
   data/accounts/btc_hex.txt
   data/accounts/btc_wif.txt
   ```

3. Set up the runtime environment: https://bun.sh/docs/installation

4. Launch the program:
   ```bash
   bun index.ts
   ```

---

## Performance Recommendations

- Increasing the `max_threads` parameter speeds up verification but may increase CPU and network load.


# ME CHECKER

**ME CHECKER** — это утилита для многопоточной проверки наличия дропов на кошельках. Программа поддерживает различные форматы кошельков и позволяет настраивать параметры многопоточности.

## Основные возможности
- Проверка наличия дропов на кошельках.
- Поддержка нескольких форматов кошельков:
  - `sol` (Solana)
  - `evm` (EVM-совместимые сети)
  - `btc_hex` (Bitcoin в формате hex)
  - `btc_wif` (Bitcoin в формате WIF)
- Настраиваемая многопоточность для повышения производительности.
- Поддержка HTTP(S) Socks(4/5) прокси
---

## Конфигурация

Для работы программы используется конфигурационный файл со следующими параметрами:

### Параметры:
- **`main_solana_wallet`**: Приватный ключ основного кошелька Solana (обязательный параметр).  
  Используется для подписей и взаимодействия с сетью Solana.

- **`max_threads`**: Максимальное количество потоков для выполнения проверок (по умолчанию: `100`).  
  Оптимизируйте значение под возможности вашего оборудования.

### Структура данных:
- **`data/accounts`**: Путь к папке с файлами, содержащими списки кошельков. Файлы должны быть в следующих форматах:
  - `sol.txt` — Solana-кошельки.
  - `evm.txt` — Ethereum/EVM-совместимые кошельки.
  - `btc_hex.txt` — Bitcoin-кошельки в формате hex.
  - `btc_wif.txt` — Bitcoin-кошельки в формате WIF.

---

## Установка и запуск

### Шаг 1: Клонирование репозитория
```bash
git clone https://github.com/antidrain-sol/me_checker
cd me-checker
```
### Шаг 2: Настройка окружения
— Установите бун по гайдам отсюда https://bun.sh/docs/installation

### Шаг 3: Настройка конфигурации
- Отредактируйте файл `data/config.toml` в корневой папке проекта, указав параметры, как показано выше.
- Добавьте файл прокси `data/proxy.txt`. **ОБЯЗАТЕЛЬНО!!!**
### Шаг 4: Запуск программы
```bash
   bun install
   bun index.ts
```

---

## Пример использования

1. Укажите приватный ключ основного кошелька Solana в конфиге:
   ```ini
   main_solana_wallet = "ВАШ_ПРИВАТНЫЙ_КЛЮЧ"
   max_threads = 50
   ```

2. Добавьте файлы с кошельками в папку `data/accounts`:
   ```plaintext
   data/accounts/sol.txt
   data/accounts/evm.txt
   data/accounts/btc_hex.txt
   data/accounts/btc_wif.txt
   ```
3. Подготовьте среду исполнения программы: https://bun.sh/docs/installation

3. Запустите программу:
   ```bash
   bun index.ts
   ```

---

## Рекомендации по производительности

- Увеличение параметра `max_threads` позволяет ускорить процесс проверки, но может повысить нагрузку на процессор и сеть.
