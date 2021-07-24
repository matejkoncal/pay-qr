#!/usr/bin/env node

const open = require("open");
const { generate } = require("bysquare");
const prompts = require("prompts");
const fs = require("fs");
const qrcode = require("qrcode-terminal");

const accountPath = "./accounts.json";
const newAccountCommand = "@addNewAccount";

const askOutputType = async () => {
  const answer = await prompts({
    message: "Select your account.",
    type: "select",
    name: "output",
    choices: [
      {
        title: "Open in browser (online only)",
        value: "browser",
      },
      {
        title: "Show in terminal",
        value: "terminal",
      },
    ],
    initial: 0,
  });
  return answer.output;
};

const generateQrString = async (amount, iban) => {
  const result = await generate({
    IBAN: iban,
    Amount: amount,
    CurrencyCode: "EUR",
    Payments: 1,
    PaymentOptions: 1,
    BankAccounts: 1,
  });
  return result;
};

const createAccount = async () => {
  const answers = await prompts([
    {
      type: "text",
      name: "alias",
      message: "Type alias for your account. (Only for your information.)",
    },
    {
      type: "text",
      name: "iban",
      message: "Type your IBAN to which to recieve payment.",
    },
  ]);
  saveAccount(answers);
  showAccountSelector();
};

const saveAccount = (account) => {
  if (fs.existsSync(accountPath)) {
    const accountsJson = fs.readFileSync(accountPath);

    try {
      const accountArray = JSON.parse(accountsJson);
      accountArray.push(account);
      fs.writeFileSync(accountPath, JSON.stringify(accountArray));
    } catch {
      console.log("Problem with read accounts file.");
    }
  } else {
    const accountArray = [];
    accountArray.push(account);
    fs.writeFileSync(accountPath, JSON.stringify(accountArray));
  }
};

const getAccountsArray = () => {
  const accountsJson = fs.readFileSync(accountPath);
  const accountArray = JSON.parse(accountsJson);
  const choices = accountArray.map((account) => {
    const choice = {
      title: account.alias,
      value: account.iban,
    };
    return choice;
  });
  return choices;
};

const openInBrowser = (rawQrData) => {
  const ecodedQrData = encodeURIComponent(rawQrData);
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ecodedQrData}`;
  console.log(url);
  open(url);
};

const askAccount = async () => {
  const accountQuestion = {
    message: "Select your account.",
    type: "select",
    name: "iban",
    choices: choices,
    initial: 0,
  };
  return await prompts(accountQuestion);
};

const askAmount = async (amountQuestion) => {
  const amountQuestion = {
    type: "number",
    name: "amount",
    float: true,
    round: 3,
    message: "Amount?",
  };
  return await prompts(amountQuestion);
};

const showAccountSelector = async () => {
  if (fs.existsSync(accountPath)) {
    const choices = getAccountsArray();

    choices.push({
      title: "add new account",
      value: newAccountCommand,
    });

    const iban = await askAccount();

    if (iban.iban === newAccountCommand) {
      createAccount();
    } else {
      const amount = await askAmount();
      const qrString = await generateQrString(amount.amount, iban.iban);
      const outputType = await askOutputType();
      if (outputType === "terminal") {
        qrcode.generate(qrString, { small: true });
      } else {
        openInBrowser(qrString);
      }
    }
  } else {
    createAccount();
  }
};

showAccountSelector();

