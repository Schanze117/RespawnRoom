export default function MenuOptions({ selected, handleChange, options, isHidden, name }) {
    return (
        <div className={`p-4 w-full ${isHidden ? 'hidden' : ''}`}>
            <ul className='flex flex-wrap gap-3'>
                {options.sort((a, b) => a.name > b.name ? 1 : -1).map((option) => (
                <li key={option.id}>
                    <div className='flex items-center'>
                        <input
                            type="checkbox"
                            name={name}
                            value={option.id}
                            checked={selected.includes(option.id.toString())}
                            onChange={handleChange}
                            id={option.slug}
                            className='hidden peer'
                        />
                        <label 
                            className="text-light peer-checked:bg-primary-600 peer-checked:text-white py-1.5 px-3 rounded-md bg-surface-700 select-none cursor-pointer transition-colors duration-200 hover:bg-surface-600" 
                            htmlFor={option.slug}
                        >
                            {option.name}
                        </label>
                    </div>
                </li>
                ))}
            </ul> 
        </div>
    )
}
