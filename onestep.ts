type X = 
  | Result
  | Method
  | List
  ;

type Result = { type: "Result", value: unknown }
type Method = { type: "Method", value: (args: X[]) => X }
type List = { type: "List", value: [X, ...X[]] }


function resolve(input: Result): Result;
function resolve(input: Method): Method;
function resolve(input: X): X;

function resolve(input: X): X {
  switch (input.type) {
    case "Result": return input;
    case "Method": return input;
    case "List":
      const head = resolve(input.value[0]);

      switch (head.type) {
        case "Method":
          const tail = input.value.slice(1).map(a => resolve(a));
          return head.value(tail);
      }
  }
}


const one: Result = { type: "Result", value: 1 };
console.log(resolve(one).value);

const returnOne: Method = { type: "Method", value: () => one };
console.log(resolve(returnOne).value([]));

const callReturnOne: List = { type: "List", value: [returnOne] };
console.log(resolve(callReturnOne).value);

const resolveArg: Method = { type: "Method", value: (args) => resolve(args[0]) };
console.log(resolve(resolveArg).value([one]));

const callReturnArg: List = { type: "List", value: [resolveArg, one]}
console.log(resolve(callReturnArg).value);


