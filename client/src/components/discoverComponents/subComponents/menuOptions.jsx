
export default function MenuOptions({ selected, handleChange, options, isHidden, name }) {

   
    return (
        
        <div className={`flex items-center w-full ps-2  genres mt-5 ${isHidden ? 'hidden' : ''}`}>
            <ul className='flex flex-wrap auto-cols-max grid-flow-col gap-4'>
                {options.sort((a, b) => a.name > b.name ? 1 : -1).map((option) => (
                <li key={option.id}>
                    <div className='flex items-center ps-2'>
                        <input
                            type="checkbox"
                            name={name}
                            value={option.id}
                            checked={selected.includes(option.id.toString())}
                            onChange={handleChange}
                            id={option.slug}
                            className='hidden peer'
                        />
                        <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor={option.slug}>{option.name}</label>
                    </div>
                </li>
                ))}
            </ul> 
        </div>
        
    )
}
