import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'

class Expression {
  Expression(str: string) {
    
  }
}

function App() {

  const [carriageNo, setCarriageNo] = useState("")

  function printCarriageNo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    make10();
  }

  function make10() {
    const digits: String[] = carriageNo.split("");
    const solns: Expression[] = [];
    for (let a of digits) {
      for (let b of digits) {
        let sum = new Function("return " + a + " + " + b);
        // console.log(sum());
      }
    }
  }

  return (
    <>
      <h1>Make 10 Solver</h1>
      <div>
        <p>Enter your carriage number:</p>
        <form onSubmit={printCarriageNo}>
          <input size={4} maxLength={4} minLength={4} onChange={(e) => {setCarriageNo(e.target.value)}}/>
          <br /><br />
          <input type='submit' />
        </form>
      </div>
    </>
  )
}

export default App

// e.target.value