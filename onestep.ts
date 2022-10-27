type X = Result | Method | List | Block | Id | Exception | Closure;

type Result = { type: "Result"; value: unknown };
type Method = { type: "Method"; value: (args: X[], context: Closure) => X };
type List = { type: "List"; value: [X, ...X[]] };
type Block = { type: "Block"; value: PairList };
type Closure = {
  type: "Closure";
  outer?: Closure;
  names: { [name: string]: X };
  args: X[];
  value: X;
};
type Id = { type: "Id"; value: string };
type Exception = { type: "Exception"; value: string };

type Pair = { type: "Pair"; value: [X, X] };
type PairList = Pair[] | [...Pair[], X] | [X];

function resolve(input: X, context: Closure): X {
  switch (input.type) {
    case "Result":
      return input;
    case "Method":
      return input;
    case "Exception":
      return input;
    case "Closure":
      return input;
      // return closeClosure                        ??
      // return resolveClosure(input, [], context); ??
    case "Block":
      return closeLambda(input, context);
    case "Id":
      return resolveIdentifier(input, context);
    case "List":
      const head = resolve(input.value[0], context);
      const tail = input.value.slice(1).map((a) => resolve(a, context));

      return resolveList(head, tail, context);
  }
}

const rootClosure: Closure = {
  type: "Closure",
  outer: undefined,
  names: {},
  args: [],
  value: { type: "Exception", value: "Root closure has no default value" },
};
function interpret(
  input: X,
  context = rootClosure
) {
  const result = resolveList(input, [], context);

  return result.value;
}

function resolveIdentifier(id: Id, context: Closure): X {
  const argMatch = id.value.match(/\$(\d+)/)
  if (argMatch) {
    return context.args[parseInt(argMatch[1])];
  }

  if (id.value in context.names) {
    return context.names[id.value];
  }

  if (context.outer) {
    return resolveIdentifier(id, context.outer);
  }

  return { type: "Exception", value: "Identifier not found: " + id.value };
}

function resolveList(head: X, tail: X[], context: Closure): X {
  switch (head.type) {
    case "Method":
      return head.value(tail, context);
    case "Closure":
      return resolveClosure(head, tail, context);
    case "Result":
      return head;
    default:
      const unwrapped = resolve(head, context);
      if (unwrapped != head) return resolveList(unwrapped, tail, context);

      return unwrapped;
  }
}

function resolveClosure(lambda: Closure, args: X[], outer: Closure): X {
  const closedArgs = closeArgs(args, outer);
  
  let context: Closure = {
    type: "Closure",
    outer: lambda.outer,
    names: {},
    args: closedArgs,
    value: lambda.value,
  };

  return context;
}

function closeArgs(args: X[], outer: Closure): X[] {
  return args.map((arg) => ({ type: "Closure", args: [], names: {}, outer, value: arg }));
}


function closeLambda(lambda: Block, outer: Closure): Closure {
  let context: Closure = {
    type: "Closure",
    outer,
    names: {},
    args: [],
    value: { type: "Exception", value: "Block result is not defined." },
  };

  // TODO: handle duplicate names by creating inner contexts!
  lambda.value.forEach((pair) => {
    if (pair.type == "Pair") {
      let id = pair.value[0];
      let resolved = resolve(id, outer);
      while (resolved != id) {
        id = resolved;
        resolved = resolve(id, outer);
        //  if (resolved.type == "Quote")
      }
      switch (id.type) {
        case "Id":
          context.names[id.value] = pair.value[1];
          break;
        case "Result":
          if (typeof id.value == "string")
            context.names[id.value] = pair.value[1];
          // TODO: error
          break;
        default:
          // TODO: error
          break;
      }
    } else {
      context.value = pair;
    }
  });

  return context;
}

const one: Result = { type: "Result", value: 1 };
console.log(interpret(one));

const returnOne: Method = { type: "Method", value: () => one };
console.log(interpret(returnOne));

const callReturnOne: List = { type: "List", value: [returnOne] };
console.log(interpret(callReturnOne));

const resolveArg: Method = {
  type: "Method",
  value: (args, context) => resolve(args[0], context),
};
const callReturnArg: List = { type: "List", value: [resolveArg, one] };
console.log(interpret(callReturnArg));

const lambdaOne: Block = { type: "Block", value: [one] };
console.log(interpret(lambdaOne));

const callLambdaOne: List = { type: "List", value: [lambdaOne] };
console.log(interpret(callLambdaOne));

const lambdaNone: Block = {
  type: "Block",
  value: [{ type: "Pair", value: [one, one] }],
};
console.log(interpret(lambdaNone));

const argOneId: Id = { type: "Id", value: "$1" };
const lambdaReturnArg: Block = { type: "Block", value: [argOneId] };
console.log(interpret(lambdaReturnArg));
