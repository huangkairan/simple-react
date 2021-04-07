function createElement (type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child=>
          typeof child === 'object'
          ? child
          : createTextElement(child)
        )
    }
  }
}

function createTextElement (text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: []
    }
  }
}

const myReact = {
  createElement,
  render
}

function createDom (fiber) {
  const dom = 
    element.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(element.type)

  const isProperty = key => key !== 'children'
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach(name=>{
      dom[name] = fiber.props[name]
    })
    
  ​return dom
}

function render (element, container ) {
  // set next unit of work
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  }
}

let nextUnitOfWork = null;
function workLoop (deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    shouldYield = deadline.timeRemaining() < 1
  }
  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)
​
function performUnitOfWork(fiber) {
  // add dom node
  if(!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  if(fiber.parent.dom) {
    fiber.parent.dom.appendChild(fiber.dom)
  }
  // create new fibers
  const elements = fiber.props.children
  let index = 0
  let prevSibling = null
​
  while (index < elements.length) {
    const element = elements[index]
​
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    }
    if(index === 0) {
      fiber.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }
    prevSibling = newFiber
    index++
  }
  // return next unit of work
  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}

/** @jsx myReact.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)

const container = document.getElementById("root")
myReact.render(element, container)
