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

const isEvent = key => key.startsWith("on")
const isProperty = key =>
  key !== "children" && !isEvent(key)
const isNew = (prev, next) => key =>
  prev[key] !== next[key]
const isGone = (prev, next) => key => !(key in next)

function updateDom(dom, prevProps, nextProps) {
   //Remove old or changed event listeners
   Object.keys(prevProps)
   .filter(isEvent)
   .filter(
     key =>
       !(key in nextProps) ||
       isNew(prevProps, nextProps)(key)
   )
   .forEach(name => {
     const eventType = name
       .toLowerCase()
       .substring(2)
     dom.removeEventListener(
       eventType,
       prevProps[name]
     )
   })
  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = ""
    })
​
  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name]
    })
  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)
      dom.addEventListener(
        eventType,
        nextProps[name]
      )
    })
}

function commitRoot() {
  // add nodes to dom
  deletions.forEach(commitWork)
  commitWork(workInProgressRoot.child)
  currentRoot = workInProgressRoot
  workInProgressRoot = null
}

function commitWork(fiber) {
  if(!fiber) {
    return
  }
  const domParent = fiber.parent.dom
  if (
    fiber.effectTag === "PLACEMENT" &&
    fiber.dom != null
  ) {
    domParent.appendChild(fiber.dom)
  } else if (
    fiber.effectTag === "UPDATE" &&
    fiber.dom != null
  ) {
    updateDom(
      fiber.dom,
      fiber.alternate.props,
      fiber.props
    )
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom)
  }
​
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
    afternate: currentRoot
  }
  deletions = []
  nextUnitOfWork = workInProgressRoot
}

let nextUnitOfWork = null
let currentRoot = null
let workInProgressRoot = null
let deletions = null
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
  if(!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  
  const elements = fiber.props.children
  reconcileChildren(fiber, elements)
  
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

function reconcileChildren(workInProgressRoot, elements) {
  let index = 0
  let oldFiber = workInProgressRoot.alternate && workInProgressRoot.alternate.child
  let prevSibling = null
​
  while (index < elements.length || oldFiber !== null) {
    const element = elements[index]
    let newFiber = null
    const sameType =
      oldFiber &&
      element &&
      element.type == oldFiber.type
​
    if (sameType) {
      // update the node
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: workInProgressRoot,
        alternate: oldFiber,
        effectTag: "UPDATE",
      }
    }
    if (element && !sameType) {
      // add this node
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: workInProgressRoot,
        alternate: null,
        effectTag: "PLACEMENT",
      }
    }
    if (oldFiber && !sameType) {
      // delete the oldFiber's node
      oldFiber.effectTag = "DELETION"
      deletions.push(oldFiber)
    }
​
    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }
    if(index === 0) {
      workInProgressRoot.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }
    prevSibling = newFiber
    index++
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
