import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import App from '../src/App.vue';

describe('App.vue', () => {
  it('renders the application title and tagline correctly', () => {
    const wrapper = mount(App);

    expect(wrapper.find('h1.title').text()).toContain('MetaGaming');
    expect(wrapper.find('p.tagline').text()).toContain('Connect, play, chat, and share your gaming journey');
  });

  it('renders the core feature cards', () => {
    const wrapper = mount(App);
    const cards = wrapper.findAll('.card');

    expect(cards.length).toBe(4);
    expect(wrapper.text()).toContain('Gamer Profiles');
    expect(wrapper.text()).toContain('Direct & Group Chat');
    expect(wrapper.text()).toContain('Game Communities');
    expect(wrapper.text()).toContain('Game Collections');
  });
});
