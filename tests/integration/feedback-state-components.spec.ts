import { readFileSync } from "node:fs";

import * as Vue from "vue";
import { compile } from "@vue/compiler-dom";
import { parse } from "@vue/compiler-sfc";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

function loadTemplate(filePath: string) {
  const source = readFileSync(new URL(filePath, import.meta.url), "utf8");
  const { descriptor } = parse(source);

  if (!descriptor.template) {
    throw new Error(`Expected a template block in ${filePath}.`);
  }

  const { code } = compile(descriptor.template.content, {
    mode: "function",
    prefixIdentifiers: true,
  });

  return new Function("Vue", `${code}; return render;`)(Vue);
}

const listSidebarRender = loadTemplate(
  "../../app/components/lists/ListSidebar.vue",
);
const taskFilterBarRender = loadTemplate(
  "../../app/components/filters/TaskFilterBar.vue",
);
const taskListRender = loadTemplate("../../app/components/tasks/TaskList.vue");

const FeedbackEmptyState = Vue.defineComponent({
  props: {
    message: {
      required: true,
      type: String,
    },
    testId: {
      default: "empty-state",
      type: String,
    },
  },
  setup(props) {
    return () => Vue.h("p", { "data-testid": props.testId }, props.message);
  },
});

const FeedbackLoadingState = Vue.defineComponent({
  props: {
    message: {
      required: true,
      type: String,
    },
    testId: {
      default: "loading-state",
      type: String,
    },
  },
  setup(props) {
    return () =>
      Vue.h(
        "p",
        {
          "data-testid": props.testId,
          role: "status",
        },
        props.message,
      );
  },
});

const NuxtLink = Vue.defineComponent({
  inheritAttrs: false,
  props: {
    to: {
      required: true,
      type: String,
    },
  },
  setup(props, { attrs, slots }) {
    return () => Vue.h("a", { ...attrs, href: props.to }, slots.default?.());
  },
});

const TasksTaskItem = Vue.defineComponent({
  props: {
    task: {
      required: true,
      type: Object,
    },
  },
  setup(props) {
    return () =>
      Vue.h(
        "article",
        { "data-testid": "task-item" },
        String(props.task.title),
      );
  },
});

async function renderComponent(
  render: (...args: unknown[]) => unknown,
  props: Record<string, unknown>,
  components: Record<string, Vue.Component>,
) {
  const component = Vue.defineComponent({
    components,
    props: Object.fromEntries(
      Object.keys(props).map((key) => [key, { required: false, type: null }]),
    ),
    render,
  });

  return renderToString(
    Vue.createSSRApp({
      render: () => Vue.h(component, props),
    }),
  );
}

describe("feedback state components", () => {
  it("renders the list load error without the list empty state", async () => {
    const html = await renderComponent(
      listSidebarRender,
      {
        activeListId: null,
        isLoading: false,
        lists: [],
        loadError: "The todo lists could not be loaded.",
      },
      {
        FeedbackEmptyState,
        FeedbackLoadingState,
        NuxtLink,
      },
    );

    expect(html).toContain("list-sidebar-error-banner");
    expect(html).toContain("The todo lists could not be loaded.");
    expect(html).not.toContain("list-sidebar-empty-state");
  });

  it("renders the task load error without the task empty state", async () => {
    const html = await renderComponent(
      taskListRender,
      {
        isLoading: false,
        kicker: "Tasks in this list",
        listAriaLabel: "Tasks in this list",
        loadError: "The tasks could not be loaded.",
        panelTestId: null,
        tasks: [],
        title: "Active tasks",
        titleId: "task-list-title",
        tone: "default",
      },
      {
        FeedbackEmptyState,
        FeedbackLoadingState,
        TasksTaskItem,
      },
    );

    expect(html).toContain("task-list-error-banner");
    expect(html).toContain("The tasks could not be loaded.");
    expect(html).not.toContain("task-list-empty-state");
  });

  it("renders a filter recovery action even when no tag is active", async () => {
    const taskFilterBar = Vue.defineComponent({
      props: {
        activeTag: {
          default: null,
          type: String,
        },
        isDisabled: {
          default: false,
          type: Boolean,
        },
        isLoading: {
          default: false,
          type: Boolean,
        },
        loadError: {
          default: null,
          type: String,
        },
        tags: {
          default: () => [],
          type: Array,
        },
      },
      render: taskFilterBarRender,
      setup() {
        return {
          isTagActive: () => false,
        };
      },
    });

    const html = await renderToString(
      Vue.createSSRApp({
        render: () =>
          Vue.h(taskFilterBar, {
            loadError:
              "The tasks could not be filtered. Clear the filter or try a different tag.",
            tags: [],
          }),
      }),
    );

    expect(html).toContain("tag-filter-bar");
    expect(html).toContain("tag-filter-clear");
    expect(html).toContain("Dismiss error");
  });
});
