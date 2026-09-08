import React from 'react';
import * as Select from '@radix-ui/react-select';
import { GroupedSelectProps } from '@/types/ui';

export const GroupedSelect: React.FC<GroupedSelectProps> = ({
  id,
  label,
  placeholder = 'Pilih opsi...',
  groups,
  value,
  onChange,
  isDisabled = false,
  isError = false,
  errorMessage,
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-slate-700 tracking-wide">
          {label}
        </label>
      )}

      <Select.Root value={value} onValueChange={onChange} disabled={isDisabled}>
        <Select.Trigger
          id={id}
          className={`flex items-center justify-between w-full px-3 py-2.5 text-sm bg-white border rounded-lg shadow-sm transition-all text-left focus:outline-none focus:ring-2 ${
            isError
              ? 'border-red-500 focus:ring-red-200'
              : 'border-slate-300 focus:border-slate-500 focus:ring-slate-100'
          } ${isDisabled ? 'bg-slate-100 cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
          <Select.Value placeholder={placeholder} />
          <Select.Icon className="text-slate-400 text-xs pl-2">▼</Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            className="z-50 min-w-[220px] max-h-[300px] bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden p-1 animate-in fade-in-80 zoom-in-95"
            position="popper"
            sideOffset={4}
          >
            <Select.Viewport className="p-1">
              {groups.map((group, groupIdx) => (
                <React.Fragment key={group.groupLabel}>
                  {groupIdx > 0 && <Select.Separator className="h-px bg-slate-100 my-1" />}
                  
                  <Select.Group>
                    <Select.Label className="px-2 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none pointer-events-none">
                      {group.groupLabel}
                    </Select.Label>

                    {group.options.map((option) => (
                      <Select.Item
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                        className="relative flex items-center justify-between px-2.5 py-2 text-sm text-slate-700 rounded-md cursor-pointer select-none outline-none data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900 data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed"
                      >
                        <div className="flex flex-col">
                          <Select.ItemText className="font-medium">{option.label}</Select.ItemText>
                          {option.description && (
                            <span className="text-xs text-slate-500">{option.description}</span>
                          )}
                        </div>
                        {option.badgeText && (
                          <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {option.badgeText}
                          </span>
                        )}
                      </Select.Item>
                    ))}
                  </Select.Group>
                </React.Fragment>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      {isError && errorMessage && (
        <span className="text-xs font-medium text-red-600">{errorMessage}</span>
      )}
    </div>
  );
};
