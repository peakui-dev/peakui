# Bump Type Guidelines

## minor

Use `minor` when:

- New component added to the package
- New public prop, slot, or export added
- New hook added
- Breaking change in existing public API (removed prop, changed signature)
- Migration of a component from v1 to v2 architecture
- New significant feature added to existing component

Examples:

```
MKI-123: Добавлен новый компонент **ComboBox** с поддержкой поиска
MKI-456: Добавлен проп `loading` для компонента **Button**
MKI-789: Компонент **InputText** мигрирован на v2 архитектуру
```

## patch

Use `patch` when:

- Bug fix in existing component
- Style or token adjustment
- Non-breaking refactoring (internal restructure, no API change)
- TypeScript type improvements (added generics, narrowed types)
- Test additions or fixes
- Documentation updates
- Dependency version bumps (unless breaking)
- Accessibility fix
- Performance improvement without API change

Examples:

```
MKI-123: Исправлено отображение тултипа в **TableCell** при переполнении
MKI-456: Обновлены токены `active` состояния для **Chip outline info**
MKI-789: Исправлена работа клавиатурной навигации в **Select**
MKI-0000: Оптимизация рендеринга **Table** для больших наборов данных
```

## Multiple packages

When changes span multiple packages, list all affected:

```yaml
---
"@peakui/react": minor
"@peakui-pro/react": patch
---
```

## Dependency cascade

When bumping, check if dependent packages export anything affected. If a token or component used downstream changed API, add a patch bump for dependents too.
