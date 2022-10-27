type Expression =
  | IdentifierExpression // foo
  | QuoteExpression // '
  | StringExpression // ""
  | TemplateExpression // ``
  | EscapeExpression // `{foo}`
  | ListExpression // () []
  | BlockExpression // {} blocks are lambdas
  | FunctionValue
  | Value;

type FunctionValue = { type: "function"; tags?: any[]; value: Function };
type Value = { type: "value"; tags?: any[]; value: unknown };

type Pair = { type: "pair"; content: [Expression, Expression] };
type PairList = Pair[] | [...Pair[], Expression] | [Expression];
type IdentifierExpression = { type: "id"; name: string };
type QuoteExpression = {
  type: "quote";
  opener: string;
  closer: string;
  value: Expression;
};
type StringExpression = {
  type: "string";
  opener: string;
  closer: string;
  literal: string;
  value: string;
};
type TemplateExpression = {
  //
  type: "template";
  opener: string;
  closer: string;
  content: (StringExpression | EscapeExpression)[];
};
type EscapeExpression = {
  type: "escape";
  opener: string;
  closer: string;
  content: ListExpression;
};
type ListExpression = {
  type: "list";
  opener: string;
  closer: string;
  content: Expression[];
};
type BlockExpression = {
  type: "block";
  opener: string;
  closer: string;
  content: PairList;
};

// type StackEntry = {
//   expression: Expression | Pair;
//   index: number;
// };
// type Stack = StackEntry[];

// function evaluate(expression: Expression) {
//   let stack: Stack = [
//     { expression, index: -1 },
//   ];
//   for (let iteration = 0; iteration < 10_000_000; iteration++) {
//     const bottom = stack[stack.length - 1];

//     if (bottom.index == -1) {
//       switch (bottom.expression.type) {
//         case "function":
//           popAndReplace();
//       }
//     }

//     function popAndReplace() {
//       const parent = stack[stack.length - 1];
//     }
//   }
// }

type ResolveType =
  | "value"
  | "id"
  | "context"
  | Omit<Expression["type"], "value" | "id">;
type Context = {
  resolveName: NameGetter;
  listNames: () => string[];
  getResult(arguments: Expression[], replacementContext: Context): any;
};
interface NameGetter {
  (name: string, target: ResolveType): any;
}
function resolve(
  expression: Expression,
  context: Context,
  target: "value"
): unknown;
function resolve(
  expression: Expression,
  context: Context,
  target: "id"
): string;
function resolve(
  expression: Expression,
  context: Context,
  target: "context"
): Context;
function resolve(
  expression: Expression,
  context: Context,
  target: Omit<Expression["type"], "value" | "id">
): Expression;

function resolve(
  expression: Expression,
  context: Context,
  target: ResolveType
): Expression | Context | string | unknown {
  switch (expression.type) {
    case "function":
      if (target == "value") return expression.value;
      if (target == "id") return expression.value + "";
      if (target == "context") return makeResultContext(expression.value);
      return expression;
    case "value":
      if (target == "value") return expression.value;
      if (target == "id") return expression.value + "";
      if (target == "context") return makeResultContext(expression.value);
      return expression;
    case "id":
      if (target == "id") return expression.name;
      return context.resolveName(expression.name, target);
    case "quote":
      if (target == "value") return expression.value;
      if (target == "id") return "'" + resolve(expression.value, context, "id");
      if (target == "context") return makeResultContext(expression.value);
      
      return resolve(expression.value, context, target);
    case "string":
      return expression;
    case "template":
      if (target == "value") return resolveTemplate(expression, context);
      return expression;
    case "escape":
      return expression.content;
    case "block":
      const block = resolveBlock(expression, context);
      if (target == "block") return block.getResult();
    case "list":
      return evaluateList(expression, context);
    default:
      const exhaustiveCheck: never = expression;
      throw new Error(`Unhandled color case: ${exhaustiveCheck}`);
  }
}

function evaluateList(expression: ListExpression, context: Context) {}

type BlockContext = Context & {
  names: { [name: string]: Expression };
  values: { [name: string]: any };
  result?: Expression;
};
function resolveBlock(
  expression: BlockExpression,
  context: Context
): BlockContext {
  const ownContext: BlockContext = {
    names: {},
    values: {},

    getName(name: string, quote?: true) {
      if (name in ownContext.names) {
        if (quote) return ownContext.names[name];

        if (!(name in ownContext.values)) {
          ownContext.values[name] = evaluate(
            ownContext.names[name],
            ownContext
          );
        }
        return ownContext.values[name];
      } else {
        return context.getName(name, quote as true); // silly typescript quote definitely works here and is probably undefined
      }
    },
    listNames() {
      return Object.keys(ownContext.names);
    },
    getResult(arguments: Expression[], replacementContext: Context) {
      if (!ownContext.result) return undefined; // TODO: maybe return the block as an object

      return evaluate(
        ownContext.result,
        joinContext(ownContext, replacementContext, arguments)
      );
    },
  };

  populateNames(expression, ownContext);
  populateResult(expression);

  return ownContext;
}

function populateNames(expression: BlockExpression, context: BlockContext) {
  expression.content.forEach((item) => {
    if (item.type == "pair") {
      const name = resolveToName();
    }
  });
}

function assertUnreachable(x: never): never {
  throw new Error("Didn't expect to get here");
}
