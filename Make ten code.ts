// Author: Kang-Wei Chan
// https://pastebin.com/8y39aFmx

/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import { useContext, Fragment, useRef, useState } from 'react';
import Media from 'react-media';

import BackButton from '../components/BackButton';
import ColorThemeToggle from '../components/ColorThemeToggle';
import { ColorThemeContext, COLOR_THEMES } from '../theme';

function permute<T>(arr: T[]) {
  const ret: T[][] = [];
  if (arr.length === 1) return [arr];
  if (arr.length === 2) return [arr, [arr[1], arr[0]]];

  arr.forEach((num, idx) => {
    const sub = Array.from(arr);
    sub.splice(idx, 1);
    permute(sub).forEach(perm => {
      ret.push([num, ...perm]);
    });
  });
  return ret;
}

interface Operator {
  name: string;
  fn: (a: number, b: number) => number;
  symbol: string;
}

const operators: Operator[] = [
  { name: 'plus', fn: (a: number, b: number) => a + b, symbol: '+' },
  { name: 'minus', fn: (a: number, b: number) => a - b, symbol: '-' },
  { name: 'times', fn: (a: number, b: number) => a * b, symbol: '×' },
  { name: 'divide', fn: (a: number, b: number) => a / b, symbol: '÷' },
  {
    name: 'exponent',
    fn: (a: number, b: number) => Math.pow(a, b),
    symbol: '^',
  },
];

type PrintFn = (p: number[], o: Operator[]) => string;
interface ParenthesesPermutation {
  fn: (p: number[], o: Operator[]) => number;
  print: PrintFn;
  calculateNumParens: (o: Operator[]) => number;
}

const parenthesesPermutations: ParenthesesPermutation[] = [
  {
    fn: (p, o) => o[0].fn(p[0], o[1].fn(p[1], o[2].fn(p[2], p[3]))),
    print: (p: number[], [o0, o1, o2]: Operator[]) => {
      let s1 = `${p[2]} ${o2.symbol} ${p[3]}`;
      if (
        ['minus', 'divide', 'exponent'].includes(o1.name) ||
        (o1.name === 'times' && ['plus', 'minus'].includes(o2.name))
      ) {
        s1 = `(${s1})`;
      }
      let s2 = `${p[1]} ${o1.symbol} ${s1}`;
      if (
        ['minus', 'divide', 'exponent'].includes(o0.name) ||
        (o0.name === 'times' && ['plus', 'minus'].includes(o1.name))
      ) {
        s2 = `(${s2})`;
      }
      return `${p[0]} ${o0.symbol} ${s2}`;
    },
    calculateNumParens: ([o0, o1, o2]) =>
      [
        ['minus', 'divide', 'exponent'].includes(o1.name) ||
          (o1.name === 'times' && ['plus', 'minus'].includes(o2.name)),
        ['minus', 'divide', 'exponent'].includes(o0.name) ||
          (o0.name === 'times' && ['plus', 'minus'].includes(o1.name)),
      ].reduce((num, showParen) => (showParen ? num + 1 : num), 0),
  }, // x . (x . (x . x))
  {
    fn: (p, o) => o[2].fn(o[1].fn(o[0].fn(p[0], p[1]), p[2]), p[3]),
    print: (p: number[], [o0, o1, o2]: Operator[]) => {
      let s1 = `${p[0]} ${o0.symbol} ${p[1]}`;
      if (
        (!['times', 'divide'].includes(o0.name) &&
          ['times', 'divide'].includes(o1.name)) ||
        o1.name === 'exponent'
      ) {
        s1 = `(${s1})`;
      }
      let s2 = `${s1} ${o1.symbol} ${p[2]}`;
      if (
        !['times', 'divide'].includes(o1.name) &&
        ['times', 'divide'].includes(o2.name)
      ) {
        s2 = `(${s2})`;
      }
      return `${s2} ${o2.symbol} ${p[3]}`;
    },
    calculateNumParens: ([o0, o1, o2]) =>
      [
        (!['times', 'divide'].includes(o0.name) &&
          ['times', 'divide'].includes(o1.name)) ||
          o1.name === 'exponent',
        !['times', 'divide'].includes(o1.name) &&
          ['times', 'divide'].includes(o2.name),
      ].reduce((num, showParen) => (showParen ? num + 1 : num), 0),
  }, // ((x . x) . x) . x
  {
    fn: (p, o) => o[1].fn(o[0].fn(p[0], p[1]), o[2].fn(p[2], p[3])),
    print: (p: number[], [o0, o1, o2]: Operator[]) => {
      let s1 = `${p[0]} ${o0.symbol} ${p[1]}`;
      if (
        (!['times', 'divide'].includes(o0.name) &&
          ['times', 'divide'].includes(o1.name)) ||
        o1.name === 'exponent'
      ) {
        s1 = `(${s1})`;
      }

      let s2 = `${p[2]} ${o2.symbol} ${p[3]}`;
      if (
        ['minus', 'divide', 'exponent'].includes(o1.name) ||
        (o1.name === 'times' && ['plus', 'minus'].includes(o2.name))
      ) {
        s2 = `(${s2})`;
      }

      return `${s1} ${o1.symbol} ${s2}`;
    },
    calculateNumParens: ([o0, o1, o2]) =>
      [
        (!['times', 'divide'].includes(o0.name) &&
          ['times', 'divide'].includes(o1.name)) ||
          o1.name === 'exponent',
        ['minus', 'divide', 'exponent'].includes(o1.name) ||
          (o1.name === 'times' && ['plus', 'minus'].includes(o2.name)),
      ].reduce((num, showParen) => (showParen ? num + 1 : num), 0),
  }, // (x . x) . (x . x)
  {
    fn: (p, o) => o[2].fn(o[0].fn(p[0], o[1].fn(p[1], p[2])), p[3]),
    print: (p: number[], [o0, o1, o2]: Operator[]) => {
      let s1 = `${p[1]} ${o1.symbol} ${p[2]}`;
      if (
        ['minus', 'divide', 'exponent'].includes(o0.name) ||
        (o0.name === 'times' && ['plus', 'minus'].includes(o1.name))
      ) {
        s1 = `(${s1})`;
      }

      let s2 = `${p[0]} ${o0.symbol} ${s1}`;
      if (
        (!['times', 'divide'].includes(o0.name) &&
          ['times', 'divide'].includes(o2.name)) ||
        o2.name === 'exponent'
      ) {
        s2 = `(${s2})`;
      }
      return `${s2} ${o2.symbol} ${p[3]}`;
    },
    calculateNumParens: ([o0, o1, o2]) =>
      [
        ['minus', 'divide', 'exponent'].includes(o0.name) ||
          (o0.name === 'times' && ['plus', 'minus'].includes(o1.name)),
        (!['times', 'divide'].includes(o0.name) &&
          ['times', 'divide'].includes(o2.name)) ||
          o2.name === 'exponent',
      ].reduce((num, showParen) => (showParen ? num + 1 : num), 0),
  }, // (x . (x . x)) . x
  {
    fn: (p, o) => o[0].fn(p[0], o[2].fn(o[1].fn(p[1], p[2]), p[3])),
    print: (p: number[], [o0, o1, o2]: Operator[]) => {
      let s1 = `${p[1]} ${o1.symbol} ${p[2]}`;
      if (
        (!['times', 'divide'].includes(o1.name) &&
          ['times', 'divide'].includes(o2.name)) ||
        o2.name === 'exponent'
      ) {
        s1 = `(${s1})`;
      }

      let s2 = `${s1} ${o2.symbol} ${p[3]}`;
      if (
        ['minus', 'divide', 'exponent'].includes(o0.name) ||
        (o0.name === 'times' && ['plus', 'minus'].includes(o2.name))
      ) {
        s2 = `(${s2})`;
      }
      return `${p[0]} ${o0.symbol} ${s2}`;
    },
    calculateNumParens: ([o0, o1, o2]) =>
      [
        (!['times', 'divide'].includes(o1.name) &&
          ['times', 'divide'].includes(o2.name)) ||
          o2.name === 'exponent',
        ['minus', 'divide', 'exponent'].includes(o0.name) ||
          (o0.name === 'times' && ['plus', 'minus'].includes(o2.name)),
      ].reduce((num, showParen) => (showParen ? num + 1 : num), 0),
  }, // x . ((x . x) . x)
];

const splitNumberIntoDigits = (num: number) => {
  const stringDigits: string[] = num.toString().split('');
  while (stringDigits.length < 4) {
    stringDigits.unshift('0');
  }
  const digits = stringDigits.map(Number);
  return digits;
};

interface Solution {
  p: number[];
  o: Operator[];
  toString: () => string;
  numParens: number;
}

const calculateSolution = (digits: number[]) => {
  const permutations = permute(digits);
  const uniquePermutations = permutations
    .map(x => x.map(y => y.toString()).join(''))
    .filter((item, idx, arr) => arr.indexOf(item) === idx)
    .map(str => str.split('').map(Number));
  const arr: Solution[] = [];
  uniquePermutations.forEach(p => {
    for (const o0 of operators) {
      for (const o1 of operators) {
        for (const o2 of operators) {
          for (const r of parenthesesPermutations) {
            const result = r.fn(p, [o0, o1, o2]);
            if (result === 10) {
              arr.push({
                p,
                o: [o0, o1, o2],
                toString: () => r.print(p, [o0, o1, o2]),
                numParens: r.calculateNumParens([o0, o1, o2]),
              });
            }
          }
        }
      }
    }
  });
  return arr;
};

const MakeTen = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [solutionText, setSolutionText] = useState('');
  const [errorText, setErrorText] = useState('');
  const { colorTheme } = useContext(ColorThemeContext);
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = inputRef.current ? inputRef.current.value : '';

      const num = Number(value);

      if (
        value === '' ||
        isNaN(num) ||
        !Number.isInteger(num) ||
        value.trim().length !== 4
      ) {
        setErrorText('Please enter a four digit number');
        setSolutionText('');
        return;
      }

      const digits = splitNumberIntoDigits(num);
      const solutions = calculateSolution(digits);
      if (solutions.length === 0) {
        setErrorText('NOT_FOUND');
        setSolutionText('');
      } else {
        // calculate score for which solution is most suitable to be displayed
        const calculateScore = (o: Operator[], numParens: number): number => {
          return (
            o.filter(x => x.name === 'plus').length * 2 +
            o.filter(x => x.name === 'times').length +
            o.filter(x => x.name === 'minus').length * -1 +
            o.filter(x => x.name === 'divide').length * -2 +
            numParens * -3 +
            o.filter(x => x.name === 'exponent').length * -4
          );
        };
        solutions.sort(
          (a, b) =>
            calculateScore(b.o, b.numParens) - calculateScore(a.o, a.numParens),
        );
        const bestSolution =
          solutions.find(s => s.p.join('') === digits.join('')) || solutions[0];
        setSolutionText(bestSolution.toString());
        setErrorText('');
      }

      // To determine what percentage of valid number combinations are still unsolved
      // const unsolved = [];
      // for (let i = 0; i <= 9999; i++) {
      //   const digits = splitNumberIntoDigits(i);
      //   const solutions = calculateSolution(digits);
      //   // const sameOrderSolutions = solutions.filter(
      //   //   s => s.p.join('') === digits.join(''),
      //   // );
      //   if (solutions.length === 0) {
      //     unsolved.push(i);
      //   }
      // }
      // console.log(`Unsolved: ${(unsolved.length / 10000) * 100}%`, unsolved);
    }
  };
  return (
    <Media query="(max-width: 599px)">
      {mobile => (
        <Fragment>
          {!mobile && <BackButton linkTo="/" />}
          {!mobile && <ColorThemeToggle />}
          <div
            css={css`
              min-height: 100vh;
              width: calc(100vw - 12%);
              display: flex;
              max-width: 750px;
              margin: 0 auto;
              padding: 0 6%;
              padding-bottom: 40px;
            `}
          >
            <div
              css={css`
                margin: 0 auto;
                margin-top: 80px;
                h2 {
                  font-size: 1.2em;
                  margin-top: 2em;
                }
              `}
            >
              <h1
                css={css`
                  text-align: center;
                  margin-bottom: 60px;
                `}
              >
                Make Ten Calculator
              </h1>
              <h4>By Kang-Wei Chan</h4>
              <b>Simply type your four digit number below and press Enter.</b>
              <div
                css={css`
                  text-align: center;
                  margin-top: 40px;
                `}
              >
                <input
                  type="text"
                  ref={inputRef}
                  css={css`
                    padding: 10px 10px;
                    border-radius: 3px;
                    font-size: 16px;
                    font-family: inherit;
                    border: ${colorTheme === COLOR_THEMES.DARK
                      ? 'none'
                      : '1px solid black'};
                    outline: none;
                  `}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <div
                css={css`
                  text-align: center;
                  margin-top: 16px;
                  height: 140px;
                  p {
                    margin: 0;
                  }
                `}
              >
                {solutionText && (
                  <p
                    css={css`
                      font-size: 24px;
                    `}
                  >
                    {solutionText}
                  </p>
                )}
                {errorText === 'NOT_FOUND' ? (
                  <p>
                    No solution found. <br />
                    <a
                      css={css`
                        color: #4570fa;
                      `}
                      href="https://twitter.com/kangweichan"
                    >
                      Tweet @kangweichan
                    </a>{' '}
                    if you think you know a solution!
                  </p>
                ) : (
                  errorText && <p>{errorText}</p>
                )}
              </div>
              <p>
                Make Ten (The Sydney Train Game) is a simple mathematical game.
              </p>
              <p>
                You are given a four digit number and your task is to use
                arithmetic operations on those four numbers individually to make
                the number 10. For example, if you have the number 1234, you can
                do 1 + 2 + 3 + 4 to make 10.
              </p>
              <p>This calculator solves that puzzle.</p>

              <h2>Why did you make this?</h2>
              <p>
                I made this calculator so that when I give up on a really hard
                set of numbers, I can know whether it is actually impossible to
                solve, or whether I missed something!
              </p>
              <h2>What arithmetic operations does this calculator know?</h2>
              <p>
                Currently this calculator knows addition, subtraction,
                multiplication and division.
              </p>
              <h2>Where did the Make Ten Game originate from?</h2>
              <p>
                The Make Ten Game is a game played on trains in the city of
                Sydney, Australia. Each train carriage in Sydney has a unique
                four digit number. Presumably to pass the time, passengers
                choose to play the Make Ten game. Disclaimer: given that it is a
                very simple game, I understand that it is likely that a game
                with these rules was played for the first time somewhere in the
                world other than on a train in Sydney.
              </p>
            </div>
          </div>
        </Fragment>
      )}
    </Media>
  );
};

export default MakeTen;
