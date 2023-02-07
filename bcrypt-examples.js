import bcrypt from "bcrypt";

const plainPW = "1234";
const numberOfRounds = 11;

console.log(
  `rounds=${numberOfRounds} means that the algorithm will be calculated 2^${numberOfRounds} times --> ${Math.pow(
    2,
    numberOfRounds
  )} times`
);
console.time("hash");
const hash = bcrypt.hashSync(plainPW, numberOfRounds);
console.timeEnd("hash");

console.log("HASH:", hash);

const isPWOk = bcrypt.compareSync(plainPW, hash);

console.log("Do they match?", isPWOk);
