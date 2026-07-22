'use client';

import { memo, useCallback, useId, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import * as Icons from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type ButtonProps = React.ComponentProps<typeof Button>;

type BaseField = {
  name: string;
  label: string;
  description?: string;
  defaultValue?: string;
  required?: boolean;
};

export type AdminSheetInputField = BaseField & {
  kind?: 'input';
  type?: 'text' | 'email' | 'tel';
  placeholder?: string;
  autoComplete?: string;
};

export type AdminSheetSelectField = BaseField & {
  kind: 'select';
  placeholder?: string;
  options: Array<{ label: string; value: string }>;
};

export type AdminSheetIconField = BaseField & {
  kind: 'icon';
  options?: Array<{ label: string; value: string }>;
};

export type AdminSheetColorField = BaseField & {
  kind: 'color';
};

export type AdminSheetFormField = AdminSheetInputField | AdminSheetSelectField | AdminSheetIconField | AdminSheetColorField;

export type AdminSheetFormAction = {
  label: string;
  type?: 'button' | 'submit' | 'reset';
  variant?: ButtonProps['variant'];
  close?: boolean;
  disabled?: boolean;
};

type AdminSheetFormProps = {
  trigger: ReactNode;
  triggerTooltip?: string;
  title: string;
  description?: string;
  fields: readonly AdminSheetFormField[];
  actions: readonly AdminSheetFormAction[];
  notice?: ReactNode;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (values: Record<string, string>) => boolean | void | Promise<boolean | void>;
};

const DEFAULT_ICON_OPTIONS = [
  { label: 'Alerta', value: 'AlertTriangle' },
  { label: 'Bache', value: 'Cone' },
  { label: 'Señalizacion', value: 'Signpost' },
  { label: 'Vehiculo', value: 'Car' },
  { label: 'Alumbrado', value: 'Lightbulb' },
  { label: 'Obra', value: 'Construction' },
  { label: 'Agua', value: 'Waves' },
  { label: 'Ambiente', value: 'Leaf' },
  { label: 'Cable', value: 'Cable' },
  { label: 'Ayuda', value: 'HelpCircle' },
];

const LUCIDE_ICON_OPTIONS = Object.entries(Icons)
  .filter(([name, value]) => {
    const icon = value as { displayName?: string; $$typeof?: symbol };
    return /^[A-Z]/.test(name) && !name.endsWith('Icon') && Boolean(icon.displayName && icon.$$typeof);
  })
  .filter(([name], index, list) => {
    const icon = Icons[name as keyof typeof Icons] as { displayName?: string };
    return list.findIndex(([otherName]) => {
      const otherIcon = Icons[otherName as keyof typeof Icons] as { displayName?: string };
      return otherIcon.displayName === icon.displayName;
    }) === index;
  })
  .map(([name]) => ({ label: name, value: name }))
  .sort((a, b) => a.label.localeCompare(b.label));

function AdminSheetFormComponent({
  trigger,
  triggerTooltip,
  title,
  description,
  fields,
  actions,
  notice,
  onOpenChange,
  onSubmit,
}: AdminSheetFormProps) {
  const [open, setOpen] = useState(false);
  const formId = useId();
  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }, [onOpenChange]);
  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const shouldStayOpen = await onSubmit?.(values) === false;
    if (!shouldStayOpen) {
      form.reset();
      handleOpenChange(false);
    }
  }, [handleOpenChange, onSubmit]);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {triggerTooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>{trigger}</SheetTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{triggerTooltip}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <SheetTrigger asChild>{trigger}</SheetTrigger>
      )}
      <SheetContent className="admin-sheet-form sm:max-w-lg">
        <form className="admin-sheet-form-content" onSubmit={handleSubmit}>
          <SheetHeader className="admin-sheet-form-header">
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          {notice}
          <FieldGroup className="admin-sheet-fields">
            {fields.map((field) => renderField(field, formId))}
          </FieldGroup>
          <SheetFooter className="admin-sheet-footer">
            {actions.map((action) => renderAction(action))}
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function renderField(field: AdminSheetFormField, formId: string) {
  const fieldId = `${formId}-${field.name}`;

  if (field.kind === 'icon') {
    return <IconField key={field.name} field={field} fieldId={fieldId} />;
  }

  if (field.kind === 'color') {
    return <ColorField key={field.name} field={field} fieldId={fieldId} />;
  }

  if (field.kind === 'select') {
    const selectProps = {
      name: field.name,
      ...(field.required === undefined ? {} : { required: field.required }),
      ...(field.defaultValue === undefined ? {} : { defaultValue: field.defaultValue }),
    };

    return (
      <Field key={field.name}>
        <FieldLabel htmlFor={fieldId}>{field.label}</FieldLabel>
        <Select {...selectProps}>
          <SelectTrigger id={fieldId} className="w-full">
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent
            align="start"
            avoidCollisions={false}
            className="admin-sheet-select-content"
            position="popper"
            side="bottom"
            sideOffset={6}
          >
            <SelectGroup>
              {field.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {field.description && <FieldDescription>{field.description}</FieldDescription>}
      </Field>
    );
  }

  return (
    <Field key={field.name}>
      <FieldLabel htmlFor={fieldId}>{field.label}</FieldLabel>
      <Input
        id={fieldId}
        name={field.name}
        type={field.type || 'text'}
        placeholder={field.placeholder}
        required={field.required}
        autoComplete={field.autoComplete}
        defaultValue={field.defaultValue}
      />
      {field.description && <FieldDescription>{field.description}</FieldDescription>}
    </Field>
  );
}

function ColorField({ field, fieldId }: { field: AdminSheetColorField; fieldId: string }) {
  const [value, setValue] = useState(field.defaultValue || '#075985');

  return (
    <Field>
      <FieldLabel htmlFor={fieldId}>{field.label}</FieldLabel>
      <input type="hidden" name={field.name} value={value} required={field.required} />
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="admin-color-trigger">
            <span style={{ backgroundColor: value }} />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="admin-color-popover" sideOffset={8}>
          <HexColorPicker color={value} onChange={setValue} />
        </PopoverContent>
      </Popover>
      {field.description && <FieldDescription>{field.description}</FieldDescription>}
    </Field>
  );
}

function IconField({ field, fieldId }: { field: AdminSheetIconField; fieldId: string }) {
  const options = field.options || LUCIDE_ICON_OPTIONS || DEFAULT_ICON_OPTIONS;
  const [value, setValue] = useState(field.defaultValue || options[0]?.value || 'HelpCircle');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const source = needle
      ? options.filter((option) => `${option.label} ${option.value}`.toLowerCase().includes(needle))
      : options;
    return source.slice(0, 60);
  }, [options, search]);

  return (
    <Field>
      <FieldLabel htmlFor={fieldId}>{field.label}</FieldLabel>
      <input type="hidden" name={field.name} value={value} required={field.required} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" className="admin-icon-trigger">
            <LucideIcon name={value} />
            <span>{value}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="admin-icon-popover"
          onWheelCapture={(event) => event.stopPropagation()}
          sideOffset={8}
        >
          <div className="admin-icon-picker">
            <Input
              id={fieldId}
              type="text"
              placeholder="Buscar icono..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoFocus
            />
            <div className="admin-icon-grid">
              {filtered.map((option) => (
                <Tooltip key={option.value}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className={value === option.value ? 'active' : ''}
                      onClick={() => {
                        setValue(option.value);
                        setOpen(false);
                      }}
                    >
                      <LucideIcon name={option.value} />
                      <span className="sr-only">{option.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{option.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {field.description && <FieldDescription>{field.description}</FieldDescription>}
    </Field>
  );
}

function LucideIcon({ name }: { name: string }) {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[name] || Icons.HelpCircle;
  return <Icon size={18} />;
}

function renderAction(action: AdminSheetFormAction) {
  const button = (
    <Button
      key={action.label}
      type={action.type || 'button'}
      variant={action.variant || 'default'}
      disabled={action.disabled}
    >
      {action.label}
    </Button>
  );

  if (!action.close) return button;

  return (
    <SheetClose key={action.label} asChild>
      {button}
    </SheetClose>
  );
}

export const AdminSheetForm = memo(AdminSheetFormComponent);
