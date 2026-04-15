import { Tree } from '@mantine/core'
import { useStore } from '@renderer/hooks/useStore'

type RawTreeItem = {
  identifier: string
  title: string
  item?: RawTreeItem[]
  [key: string]: unknown
}

type TreeNode = {
  key: string
  label: string
  value: string
  resource: RawTreeItem
  children?: TreeNode[]
}

const Menu = (): React.JSX.Element => {
  const tree = useStore((state) => state.app.tree)

  const convertToTree = (items: RawTreeItem[] | RawTreeItem): TreeNode[] => {
    // Ensure items is array
    items = Array.isArray(items) ? items : [items]

    return items.reduce<TreeNode[]>((acc, item) => {
      // Create new item
      const newItem: TreeNode = {
        key: item.identifier,
        label: item.title,
        value: item.identifier,
        resource: {
          ...item
        }
      }

      // Get and convert child items
      const { item: children } = item
      if (children) {
        newItem.children = convertToTree(children)
      }
      // Add to accumulator and return
      acc.push(newItem)
      return acc
    }, [])
  }

  const data = Array.isArray(tree) ? convertToTree(tree as RawTreeItem[]) : []

  return (
    <div className="menu">
      <Tree data={data} onClick={(e) => console.log(e)} />
    </div>
  )
}

export default Menu
