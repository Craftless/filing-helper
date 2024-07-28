#!/usr/bin/env node

import { confirm, input, number, select } from "@inquirer/prompts";
import { exec } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { PDFDocument } from "pdf-lib";
import getAllFiles from "./utils/getAllFiles";
import getFileExtension from "./utils/getFileExtension";

const dir_path = process.cwd();

const answer = await confirm({ message: "Start?" });
if (!answer) process.exit(0);

for (const subject in SUBJECTS) {
  if (!fs.existsSync(subject)) {
    fs.mkdirSync(subject, { recursive: true });
  }
}

async function begin() {
  for (const file of getAllFiles(dir_path)) {
    if (getFileExtension(file) !== "pdf") continue;
    exec(`open ${os.type() === "Darwin" ? "-a Preview" : ""} ${file}`);
    const docmentAsBytes = await fs.promises.readFile(file);
    const pdfDoc = await PDFDocument.load(docmentAsBytes);
    console.log(`Opening ${file}. Page count: ${pdfDoc.getPageCount()}`);

    const subject = await select({
      message: "Select a subject",
      choices: SUBJECTS.map((s) => ({ value: s, name: s })),
    });

    while (pdfDoc.getPageCount() > 0) {
      const page = await number({ message: "Last page" });
      const name = await input({
        message: "Name",
      });
      const confirmedSubject = await select({
        message: "Select a subject",
        default: subject,
        choices: SUBJECTS.map((s) => ({ value: s, name: s })),
      });

      const subDocument = await PDFDocument.create();
      const copiedPages = await subDocument.copyPages(
        pdfDoc,
        Array.from(Array(page).keys())
      );
      copiedPages.forEach((page) => subDocument.addPage(page));

      const newFile = await subDocument.save();
      await writePdfFile(
        path.join(dir_path, confirmedSubject, `${name}.pdf`),
        newFile
      );

      [...Array(page)].forEach((a) => pdfDoc.removePage(0));
      const newSource = await pdfDoc.save();
      await writePdfFile(file.split("/").reverse()[0], newSource);
      console.log("Success!");
    }
  }
}

async function writePdfFile(fileName: string, bytes: Uint8Array) {
  return fs.promises.writeFile(fileName, bytes);
}

await begin();
