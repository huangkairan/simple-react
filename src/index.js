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

function commitRoot() {
  // TODO add nodes to dom
  commitWork(workInProgressRoot.child)
  workInProgressRoot = null
}

function commitWork(fiber) {
  if(!fiber) {
    return
  }
  const domParent = fiber.parent.dom
  domParent.appendChild(fiber.dom)
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function render (element, container ) {
  // set next unit of work
  workInProgressRoot = {
    dom: container,
    props: {
      children: [element],
    },
  }
  nextUnitOfWork = workInProgressRoot
}

let nextUnitOfWork = null
let workInProgressRoot = null
function workLoop (deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    shouldYield = deadline.timeRemaining() < 1
  }
  if(!nextUnitOfWork && workInProgressRoot) {
    commitRoot()
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
