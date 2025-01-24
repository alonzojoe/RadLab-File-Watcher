import { Fragment } from 'react/jsx-runtime'
const DIV_COUNT = Array.from({ length: 10 }, (_, index) => index + 1)

const Terminal = (): JSX.Element => {
  return (
    <div className="bg-separator w-full overflow-y-auto rounded-lg h-40 md:h-[80vh] p-2 mx-2">
      {DIV_COUNT.map((c) => (
        <Fragment key={c}>
          <div className="text-green-500 text-sm font-semibold">File Watcher Started...</div>
          <div className="text-red-500 text-sm font-semibold">File Watcher Started...</div>
          <div className="text-red-500 text-sm font-semibold">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Exercitationem incidunt fuga
            veritatis animi saepe error voluptatibus aspernatur rem aperiam quia pariatur commodi
            recusandae reprehenderit reiciendis cupiditate, excepturi ea dolorem est.
          </div>
          <div className="text-red-500 text-sm font-semibold">File Watcher Started...</div>
        </Fragment>
      ))}
    </div>
  )
}

export default Terminal
